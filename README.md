# reForis LibreSpeed Plugin

To learn more about the plugin system see documentation of
[reForis](https://gitlab.nic.cz/turris/reforis).

## Installing reForis Python package

By default, the latest version of the reForis package is automatically installed
when executing the `make prepare-dev` command. If you wish to use the
development (editable) version from a local directory, run `make
install-local-reforis`. It assumes that reForis is in the `reforis` directory
alongside the plugin directory.

Please note that you still need to upload the reForis code to the router to
consider changes.

## API

Each endpoint under `/reforis/librespeed/api` but `/storage` is one action of
the foris-controller `librespeed` module (2.0 or newer), whose schema describes
the replies. Measurements, schedules and history are those of
librespeed-common, so they are shared with luci-app-librespeed.

| Method | Path | Module action |
|---|---|---|
| GET | `/status` | `get_status`: running, phase, progress, failures |
| POST | `/start` | `start`: `{"interface": "wan"}` or no body for the default. A refusal is a 200 reply with `started: false` and an `error` code |
| POST | `/stop` | `stop` |
| GET | `/result` | `get_result`: the last measurement |
| GET | `/history` | `get_history`: optional `from` and `to` (Unix seconds) and `limit` |
| GET | `/config` | `get_config` |
| POST | `/config` | `update_config`: only the settings given change. A refusal is 400 with a readable message |
| GET | `/links` | `get_links`: interfaces that can be measured |
| GET | `/storage` | the storage module's `get_state`, reduced to `installed` and `using_external` (whether `/srv` is on an external drive) |

The settings page shows only part of the configuration. The server, the
protocol and the history file are left to LuCI, and the page never sends them.
