# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-11-16

### Added

- Measure any interface, with the progress of each stage
- Edit the measurement schedule, per interface as well
- Show the history of measurements, also those from schedules and LuCI
- Keep daily averages on the external drive set up in the Storage plugin

### Changed

- Require foris-controller-librespeed-module 2.0, which measures through
  librespeed-common
- Start the history afresh. Results measured by 1.x, kept in /tmp by default,
  are not carried over
- Update translation messages

### Removed

- Remove the 1.x autostart form and results table

## [1.4.1] - 2026-10-26

### Added

- Added & updated Weblate translations

### Changed

- Fixed chronological sorting of the date-time column in ResultsTable
- Updated several npm dependencies
- NPM audit fix

## [1.4.0] - 2025-11-03

### Added

- Added & updated Weblate translations

### Changed

- Updated several dependencies in package.json

## [1.3.0] - 2025-04-25

### Added

- Added & updated Weblate translations

### Changed

- Updated dependencies in package.json
- Fixed webpack configuration for process/browser.js
- Re-resolved and re-locked all npm dependencies in package-lock.json

## [1.2.0] - 2024-11-28

### Added

- Add FontAwesome v6 library
- Added & updated Weblate translations

### Changed

- Updated Foris JS library to version 6.5.0
- Refactored refresh button with FontAwesome icon
- Refactored ResultsTable to use RichTable for improved performance and enhanced usability

## [1.1.0] - 2024-06-17

### Changed

- Updated Foris JS library to v6.0.0
- NPM audit fix

### Removed

- Removed unused files and dependencies

## [1.0.0] - 2024-03-05

### Added

- Added repository URL to package.json and updated eslint version

### Changed

- Updated Webpack to v5 & plugins to latest versions
- Updated dependencies
- Updated Node.js version to v21 in Makefile
- Updated eslint-config-reforis to v2.1.1
- Updated CI to use shared scripts, build and publish python package
- Updated .gitignore to include license and text files
- Changed build system to hatch
- Replaced Pylint & Pycodestyle for Ruff

## [0.2.1] - 2024-01-12

### Added

- Added & updated Weblate translations
- Added missing foris-controller module installation

### Changed

- Dropped pin of Flask-Babel
- Dropped pylint-quotes
- NPM audit fix

## [0.2.0] - 2023-10-13

### Added

- Added & updated Weblate translations
- Added CHANGELOG.md

### Changed

- Used custom reforis-image
- Updated classifiers in setup.py
- Pined pylint < 3 to be compatible with pylint-quotes
- Pined specific flask-babel & werkzeug versions
- Fixed linting issues
- NPM audit fix
- Some other changes & improvements

## [0.1.0] - 2023-03-02

- Initial implementation

[unreleased]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v2.0.0...master
[2.0.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v1.4.1...v2.0.0
[1.4.1]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v1.4.0...v1.4.1
[1.4.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v1.3.0...v1.4.0
[1.3.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v1.2.0...v1.3.0
[1.2.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v1.1.0...v1.2.0
[1.1.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v1.0.0...v1.1.0
[1.0.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v0.2.1...v1.0.0
[0.2.1]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v0.2.0...v0.2.1
[0.2.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/compare/v0.1.0...v0.2.0
[0.1.0]: https://gitlab.nic.cz/turris/reforis/reforis-librespeed/-/tags/v0.1.0
