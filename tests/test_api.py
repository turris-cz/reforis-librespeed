#  Copyright (C) 2020-2023 CZ.NIC z.s.p.o. (https://www.nic.cz/)
#
#  This is free software, licensed under the GNU General Public License v3.
#  See /LICENSE for more information.

from http import HTTPStatus
from unittest import mock

import pytest
from reforis.backend import ExceptionInBackend
from reforis.test_utils import mock_backend_response
from reforis.test_utils.mocked_send import get_mocked_send


@pytest.mark.parametrize(
    "path,action",
    [
        ("/librespeed/api/status", "get_status"),
        ("/librespeed/api/result", "get_result"),
        ("/librespeed/api/config", "get_config"),
        ("/librespeed/api/links", "get_links"),
        ("/librespeed/api/history", "get_history"),
    ],
)
def test_get_routes_pass_the_reply_through(client, path, action):
    @mock_backend_response({"librespeed": {action: {"key": "value"}}})
    def get(client):
        return client.get(path)

    response = get(client)
    assert response.status_code == HTTPStatus.OK
    assert response.json == {"key": "value"}


@mock_backend_response({"librespeed": {"start": {"started": True}}})
def test_start(client):
    response = client.post("/librespeed/api/start", json={"interface": "wan"})
    assert response.status_code == HTTPStatus.OK
    assert response.json == {"started": True}


@mock_backend_response({"librespeed": {"start": {"started": True}}})
def test_start_without_a_body_measures_the_default(client):
    response = client.post("/librespeed/api/start")
    assert response.status_code == HTTPStatus.OK


@mock_backend_response(
    {"librespeed": {"start": {"started": False, "error": "already_running", "message": "already running"}}}
)
def test_a_refused_start_is_a_reply_not_an_error(client):
    response = client.post("/librespeed/api/start", json={})
    assert response.status_code == HTTPStatus.OK
    assert response.json["error"] == "already_running"


@mock_backend_response({"librespeed": {"start": {"started": True}}})
def test_start_refuses_a_non_string_interface(client):
    response = client.post("/librespeed/api/start", json={"interface": 1})
    assert response.status_code == HTTPStatus.BAD_REQUEST


@mock_backend_response({"librespeed": {"stop": {"stopped": True}}})
def test_stop(client):
    response = client.post("/librespeed/api/stop")
    assert response.status_code == HTTPStatus.OK
    assert response.json == {"stopped": True}


@mock_backend_response({"librespeed": {"get_history": {"resolution": "raw", "entries": []}}})
def test_history_takes_its_range_from_the_query(client):
    response = client.get("/librespeed/api/history?from=1794000000&limit=5")
    assert response.status_code == HTTPStatus.OK


@pytest.mark.parametrize("query", ["from=yesterday", "limit=0", "to=-1", "limit=²"])
def test_history_refuses_a_bad_query(client, query):
    response = client.get(f"/librespeed/api/history?{query}")
    assert response.status_code == HTTPStatus.BAD_REQUEST


@mock_backend_response({"librespeed": {"update_config": {"result": True}}})
def test_post_config(client):
    response = client.post("/librespeed/api/config", json={"scheme": "http"})
    assert response.status_code == HTTPStatus.OK


@mock_backend_response(
    {"librespeed": {"update_config": {"result": False, "error": "duplicate_link", "message": "wan"}}}
)
def test_a_refused_config_says_why(client):
    response = client.post("/librespeed/api/config", json={"interface_schedules": []})
    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.json == "Two enabled schedules would measure the same connection."


@mock_backend_response(
    {"librespeed": {"update_config": {"result": False, "error": "links_unavailable", "message": "netifd"}}}
)
def test_a_config_netifd_cannot_check_says_why(client):
    response = client.post("/librespeed/api/config", json={"interface_schedules": []})
    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.json == (
        "The router could not tell which interfaces share a connection. Try again later, or enable only one schedule."
    )


def test_post_config_refuses_an_empty_body(client):
    response = client.post("/librespeed/api/config", json={})
    assert response.status_code == HTTPStatus.BAD_REQUEST


def storage_backend(state):
    """The backend with the storage module answering state, None for no module."""
    default = get_mocked_send()

    def perform(module, action, data=None, **kwargs):
        if module == "storage":
            assert (action, kwargs) == ("get_state", {"raise_exception_on_failure": False})
            return state
        return default(module, action, data)

    return perform


@pytest.mark.parametrize(
    "state,expected",
    [
        ({"using_external": True, "is_broken": False}, {"installed": True, "using_external": True}),
        ({"using_external": True, "is_broken": True}, {"installed": True, "using_external": False}),
        ({"using_external": False, "is_broken": False}, {"installed": True, "using_external": False}),
        (None, {"installed": False, "using_external": False}),
    ],
)
def test_storage_tells_whether_srv_is_on_an_external_drive(client, state, expected):
    with mock.patch("flask.current_app.backend.perform") as perform:
        perform.side_effect = storage_backend(state)
        response = client.get("/librespeed/api/storage")
    assert response.status_code == HTTPStatus.OK
    assert response.json == expected


@pytest.mark.parametrize(
    "body,content_type",
    [('{"interface": "lte"', "application/json"), ('{"interface": "lte"}', "text/plain"), ("[]", "application/json")],
)
@mock_backend_response({"librespeed": {"start": {"started": True}}})
def test_start_refuses_a_body_that_is_not_a_json_object(client, body, content_type):
    response = client.post("/librespeed/api/start", data=body, content_type=content_type)
    assert response.status_code == HTTPStatus.BAD_REQUEST


@mock_backend_response({"librespeed": {"start": {"started": True}}})
def test_start_refuses_what_is_not_an_interface_name(client):
    response = client.post("/librespeed/api/start", json={"interface": "wan-1; reboot"})
    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_a_config_the_module_refuses_is_a_readable_400(client):
    default = get_mocked_send()

    def perform(module, action, data=None, **kwargs):
        if (module, action) == ("librespeed", "update_config"):
            raise ExceptionInBackend({"module": module, "action": action}, "", "Incorrect input.")
        return default(module, action, data)

    with mock.patch("flask.current_app.backend.perform", side_effect=perform):
        response = client.post("/librespeed/api/config", json={"history": {"retention_days": 0}})
    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.is_json
