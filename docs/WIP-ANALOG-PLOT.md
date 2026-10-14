# Recorded analog plot and CSV — unpublished groundwork for L14

The simulator can plot explicitly recorded adc_time_ms, adc_counts and adc_volts program variables. A simulation-clock expression lets the program timestamp its reads. The extractor skips frames with no recorded sample and repeated identical sample timestamps, rejects malformed values, backwards clocks and conflicting values for one timestamp, and never synthesizes samples by rereading the model. The plot also rejects recorded values outside the selected model's range.

The UI switches between volts and ADC counts, labels the simulation time axis in milliseconds and shows the configured full-scale value. CSV exports both counts and volts with explicit simulation origin and sample timestamps. New UI captions and the simulation-clock block label have draft Russian/Kazakh translations. The CSV uses the existing quoted-cell exporter; an initial test incorrectly expected unquoted cells and was corrected without changing that exporter.

All 150 unit tests pass; aggregate package branch coverage is 1058/1141 (92.72%), with unchanged per-file thresholds. Typecheck, lint and build pass. The targeted source Electron test loads an actual sampling block program, runs a noisy voltage-change model, switches plot units and downloads a ten-sample CSV from 0 through 180 ms. It passes. The rendered screenshot was inspected; the plot controls were moved above the chart and the test was repeated successfully.

Reports and the inspected screenshot are in `evidence/wip-analog-plot/`. L14 text and its lesson artifact remain outstanding; authored lesson count is still 13/60. This targeted test does not replace full regression, installed acceptance or physical ADC measurements. Existing release 0.5.0 artifacts remain unchanged.
