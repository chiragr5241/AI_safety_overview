import copy

import pytest

from overview.models import Dataset
from overview.repository import FileRepository


@pytest.fixture(scope="session")
def _raw() -> dict:
    return FileRepository().raw()


@pytest.fixture
def raw(_raw) -> dict:
    """A copy of the files in data/, safe to change inside a test."""
    return copy.deepcopy(_raw)


@pytest.fixture(scope="session")
def ds(_raw) -> Dataset:
    return Dataset.model_validate(_raw)
