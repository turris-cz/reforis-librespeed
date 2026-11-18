#  Copyright (C) 2020-2023 CZ.NIC z.s.p.o. (https://www.nic.cz/)
#
#  This is free software, licensed under the GNU General Public License v3.
#  See /LICENSE for more information.

"""LibreSpeed plugin for reForis.

Each route is one action of the foris-controller librespeed module, so the
module's schema describes the replies as well.
"""

import re
from http import HTTPStatus
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_babel import gettext as _
from reforis.backend import ExceptionInBackend
from reforis.foris_controller_api.utils import APIError

blueprint = Blueprint(
    "LibreSpeed",
    __name__,
    url_prefix="/librespeed/api",
)

BASE_DIR = Path(__file__).parent

librespeed = {
    "blueprint": blueprint,
    # Define {python_module_name}/js/app.min.js
    # See https://gitlab.nic.cz/turris/reforis/reforis-distutils/blob/master/reforis_distutils/__init__.py#L11
    "js_app_path": "reforis_librespeed/js/app.min.js",
    "translations_path": BASE_DIR / "translations",
}


def perform(action, data=None):
    return current_app.backend.perform("librespeed", action, data)


# As the module's schema names an interface.
INTERFACE_RE = re.compile(r"[A-Za-z0-9_]+")


def json_object():
    """The body as a JSON object. No body is an empty one, anything else is refused."""
    if not request.get_data():
        return {}
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise APIError(_("Invalid JSON"), HTTPStatus.BAD_REQUEST)
    return data


@blueprint.route("/status", methods=["GET"])
def get_status():
    """The state of measurements, to poll while one runs."""
    return jsonify(perform("get_status"))


@blueprint.route("/start", methods=["POST"])
def start():
    """Start a measurement of {"interface": ...} or of the default interface.

    A refusal is a normal reply ({"started": false, "error": ...}), not an
    HTTP error: the client decides how to present it.
    """
    interface = json_object().get("interface", "")
    if not isinstance(interface, str) or (interface and not INTERFACE_RE.fullmatch(interface)):
        raise APIError(_("The interface must be a name."), HTTPStatus.BAD_REQUEST)
    return jsonify(perform("start", {"interface": interface} if interface else None))


@blueprint.route("/stop", methods=["POST"])
def stop():
    return jsonify(perform("stop"))


@blueprint.route("/result", methods=["GET"])
def get_result():
    return jsonify(perform("get_result"))


@blueprint.route("/history", methods=["GET"])
def get_history():
    """Results. ?from=, ?to= (Unix seconds) and ?limit= are optional."""
    query = {}
    for key in ("from", "to", "limit"):
        value = request.args.get(key)
        if value is None:
            continue
        # isdigit() alone takes digits such as "²", which int() refuses.
        if not (value.isascii() and value.isdigit()) or (key == "limit" and int(value) < 1):
            raise APIError(_("Invalid value of %(key)s.", key=key), HTTPStatus.BAD_REQUEST)
        query[key] = int(value)
    return jsonify(perform("get_history", query or None))


@blueprint.route("/config", methods=["GET"])
def get_config():
    return jsonify(perform("get_config"))


CONFIG_ERRORS = {
    "duplicate_link": lambda: _("Two enabled schedules would measure the same connection."),
    "invalid_hours": lambda: _("A time window must not end before it starts."),
    "links_unavailable": lambda: _(
        "The router could not tell which interfaces share a connection. Try again later, or enable only one schedule."
    ),
}


@blueprint.route("/config", methods=["POST"])
def post_config():
    """Change the settings it names. A refusal is 400 with a readable message."""
    data = json_object()
    if not data:
        raise APIError(_("Invalid JSON"), HTTPStatus.BAD_REQUEST)
    try:
        response = perform("update_config", data)
    except ExceptionInBackend:
        # The module's schema refused it: say so in JSON, not reForis's HTML page.
        raise APIError(_("Cannot update LibreSpeed settings."), HTTPStatus.BAD_REQUEST) from None
    if response.get("result") is not True:
        message = CONFIG_ERRORS.get(response.get("error"), lambda: _("Cannot update LibreSpeed settings."))()
        raise APIError(message, HTTPStatus.BAD_REQUEST)
    return jsonify(response), HTTPStatus.OK


@blueprint.route("/links", methods=["GET"])
def get_links():
    return jsonify(perform("get_links"))


@blueprint.route("/storage", methods=["GET"])
def get_storage():
    """Whether /srv is on the external drive the Storage plugin set up.

    The one route that is not a librespeed action: the storage module's state,
    reduced to what the settings need. Without that module, nothing is there.
    """
    state = current_app.backend.perform("storage", "get_state", raise_exception_on_failure=False)
    if not isinstance(state, dict) or "using_external" not in state:
        return jsonify({"installed": False, "using_external": False})
    external = bool(state.get("using_external")) and not state.get("is_broken")
    return jsonify({"installed": True, "using_external": external})
