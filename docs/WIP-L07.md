# L07: Variables and units

Current source adds the seventh substantive lesson with complete draft English, Kazakh and Russian sections, three explained assessments, a starter, and a reference program. The content auditor counts 751 English learner words. The lesson requires a learner-created variable table and predictions, demonstrates explicit milliseconds/metres/percent, and distinguishes a speed request from a measured speed.

The robot program samples model distance, classifies it against a configurable threshold, and reads its sampling interval from a variable. It issues no wheel command. Nine domain cases verify three intervals and three threshold/request combinations while checking the robot remains stationary. A real Electron test loads the lesson into Blockly and executes the reference through the robot worker, observing CLEAR at 240 ms. Hardware generation correctly rejects its simulated sensor, and physical execution remains NOT RUN.

Content validation still fails its full release gate: 53 lessons are missing and technical language review is outstanding. This lesson and expression-wait support are source changes after the published 0.3.0 installer and archive; those artifacts still contain six lessons. No full-completion claim is made.
