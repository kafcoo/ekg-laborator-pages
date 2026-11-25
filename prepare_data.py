"""Regenerate the local browser data using the adjacent course files."""
from pathlib import Path
import json
import sys

import numpy as np
from scipy import signal
from scipy.io import loadmat

HERE = Path(__file__).resolve().parent
COURSE = HERE.parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(COURSE / "py-ecg-detectors"))
from ecgdetectors import Detectors

FS = 1000
OUT = HERE / "data"


def save(name, data):
    (OUT / name).write_text(json.dumps(data, separators=(",", ":"), allow_nan=False))


def rounded(values, digits=6):
    return np.round(values, digits).tolist()


def band(kind, edge, order=4):
    return signal.butter(order, edge, btype=kind, fs=FS, output="sos")


def synthetic():
    """Clean timing stays fixed across all synthetic noise conditions."""
    t = np.arange(16000) / FS
    r = .55 + np.cumsum(np.r_[0, np.resize([.82, .88, .79, .85, .81], 18)])
    x = np.zeros_like(t)
    for index, peak in enumerate(r):
        def g(offset, width, amplitude):
            return amplitude * np.exp(-.5 * ((t - peak - offset) / width) ** 2)
        x += g(-.16, .023, .13) + g(.28, .058, .25)
        if index == 9:
            x += g(0, .048, .30) + g(.11, .044, -.10)
        else:
            x += g(-.026, .009, -.16) + g(0, .012, 1.0) + g(.026, .011, -.24)
    rng = np.random.default_rng(150)
    noisy = x + .19 * np.sin(2 * np.pi * 50 * t) + .16 * np.sin(2 * np.pi * .32 * t)
    burst = (t > 6.0) & (t < 7.1)
    noisy += rng.normal(0, .018, len(t)) + burst * rng.normal(0, .19, len(t))
    noisy += .65 * np.exp(-.5 * ((t - 11.5) / .015) ** 2)
    return x, noisy, np.rint(r * FS).astype(int).tolist()


def moving_mean_causal(x, size):
    return signal.lfilter(np.ones(size) / size, [1], x)


def pan_pipeline(x):
    """Teaching adaptation to 1000 Hz with a single integrated decision channel."""
    filtered = signal.sosfilt(band("bandpass", [5, 15], 1), x)
    derivative = np.diff(filtered, prepend=filtered[0]) * FS
    squared = derivative ** 2
    integrated = moving_mean_causal(squared, 150)
    candidates = signal.find_peaks(integrated, distance=75)[0]
    candidates = candidates[candidates >= 300]
    startup = integrated[candidates[candidates < 2400]]
    signal_level = np.max(startup) if len(startup) else 0
    noise_level = np.median(startup) * .25 if len(startup) else 0
    starts = []
    searchbacks = []
    rejected = []
    high = np.empty_like(x)
    last = 0
    threshold = noise_level + .25 * (signal_level - noise_level)
    for i in candidates:
        high[last:i] = threshold
        last = i
        if integrated[i] >= threshold and (not starts or i - starts[-1] >= 255):
            if len(starts) >= 4:
                rr = np.mean(np.diff(starts[-9:]))
                if i - starts[-1] > 1.66 * rr:
                    eligible = [j for j in rejected if starts[-1] + 255 <= j <= i - 255 and integrated[j] >= threshold / 2]
                    if eligible:
                        recovered = max(eligible, key=lambda j: integrated[j])
                        starts.append(recovered)
                        searchbacks.append(recovered)
            starts.append(int(i))
            rejected.clear()
            signal_level = .875 * signal_level + .125 * integrated[i]
        else:
            rejected.append(int(i))
            noise_level = .875 * noise_level + .125 * integrated[i]
        threshold = noise_level + .25 * (signal_level - noise_level)
    high[last:] = threshold
    return filtered, derivative, squared, integrated, high, starts, searchbacks


def align(x, detections, back, ahead):
    """Relocalize a delayed marker to the dominant absolute ECG deflection."""
    centered = signal.sosfiltfilt(band("bandpass", [.5, 40]), x)
    result = {}
    for sample in detections:
        start, stop = max(0, sample - back), min(len(x), sample + ahead + 1)
        result[sample] = int(start + np.argmax(np.abs(centered[start:stop])))
    return result


def detection_data(x, reference=None):
    filtered, derivative, squared, integrated, high, peaks, search = pan_pipeline(x)
    pan = align(x, peaks, 175, 40)
    hamilton_raw = Detectors(FS).hamilton_detector(x)
    hamilton = align(x, hamilton_raw, 115, 38)
    return {
        "input": rounded(x, 5), "band": rounded(filtered),
        "diff": rounded(derivative, 4), "square": rounded(squared, 3),
        "mwi": rounded(integrated, 3), "threshold": rounded(high, 3),
        "panLag": peaks, "pan": sorted(set(pan.values())),
        "hamLag": [int(i) for i in hamilton_raw], "ham": sorted(set(hamilton.values())),
        "search": search, "ref": reference,
    }


def main():
    OUT.mkdir(exist_ok=True)
    original = np.loadtxt(next(COURSE.glob("ECG_II_*.txt")))
    assert original.shape == (41355,) and np.isfinite(original).all()
    filters = {
        "hp": band("highpass", .5), "notch": band("bandstop", [49, 51], 6),
        "lp": band("lowpass", 25), "bp": band("bandpass", [.5, 20]),
        "bad": band("highpass", 5),
    }
    save("filter.json", {
        "raw": rounded(original, 5),
        **{name: rounded(signal.sosfiltfilt(sos, original), 5) for name, sos in filters.items()}
    })
    clean, noisy, ref = synthetic()
    regions = {"clean": original[:10000], "drift": original[10000:20000],
               "mains": original[20000:30000], "emg": original[30000:],
               "synth": clean, "noisy": noisy}
    for name, x in regions.items():
        save(f"qrs-{name}.json", detection_data(x, ref if name in {"synth", "noisy"} else None))
    rr = np.loadtxt(COURSE / "rr.txt").astype(int)
    assert len(rr) == 73 and rr.sum() == 7594
    save("rr.json", rr.tolist())
    tissue = loadmat(COURSE / "ap_potkan.mat")["cmosData"]
    assert tissue.shape == (100, 100, 205)
    frames = np.rot90(tissue, axes=(0, 1)).transpose(2, 0, 1)
    assert np.max(np.abs(frames)) < 32767
    frames.astype("<i2").tofile(OUT / "optical.i16")
    assert np.std(signal.sosfiltfilt(filters["hp"], original)[13000:19000]) < np.std(original[13000:19000])
    window = np.arange(22000, 28000) / FS
    tone = np.exp(-2j * np.pi * 50 * window)
    before = abs(tone @ original[22000:28000])
    after = abs(tone @ signal.sosfiltfilt(filters["notch"], original)[22000:28000])
    assert after < .02 * before
    print(f"Notch, relativní amplituda 50 Hz: {after / before:.5f}")


if __name__ == "__main__":
    main()
