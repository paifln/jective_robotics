# Approved toolchain setup

Pinned CLI: 1.5.1. Windows x64 official ZIP SHA256: `fabe42e0eb04d00e776a66178299ff95a46c623dbc260f997e58fd514853dd40`. The downloaded ZIP was compared to the official release checksum. Extract `arduino-cli.exe` into `.toolchain/bin` before building an installer. Never obtain an executable from an imported project or profile.

Run `powershell -ExecutionPolicy Bypass -File scripts/toolchain-setup.ps1` from the repository to install the approved ESP32 3.3.12 packages into the application's per-user toolchain directory. Installation is an explicit online administrator/preparation action; editing never installs anything. Use `-Destination .toolchain/workspace` for isolated compiler tests. Package preparation may download several GB of tools for the ESP32 core. Preserve the official package licenses.

For an offline preparation workflow copy the approved `data`, `downloads` and `user` directories to a removable drive after successful installation, compute SHA256 for every file, and preserve the manifest and package indexes. Copy the bundle into the destination school's `%APPDATA%/jective-robotics-studio/toolchain` before use. The application writes absolute configuration paths for its own destination. This manual bundle procedure still needs an automated integrity-checking importer and a clean disconnected-machine acceptance test; offline compile readiness is not yet certified.

`JECTIVE_TOOLCHAIN_ROOT` overrides only the application-owned toolchain directory for reproducible local test runs. It does not change the executable, FQBN, core recipe or allowed arguments. Do not point it at an unrelated Arduino workspace.

The CLI 1.5.1 help was inspected: `compile --fqbn --build-path` is supported; `upload --fqbn --port --input-dir` uploads without compiling. Upload is not implemented in this milestone.

Official references: [configuration](https://docs.arduino.cc/arduino-cli/configuration/), [ESP32 installation](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html), [CLI release](https://github.com/arduino/arduino-cli/releases/tag/v1.5.1).
