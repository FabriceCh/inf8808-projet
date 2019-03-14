import sc2reader
import matplotlib.pyplot as plt
import numpy as np


class Pysc2Error(Exception):
    pass


class Pysc2EmptyListError(Pysc2Error):
    pass


def _select_from_list(ev_list, predicate):
    """Select all events from a list satisfying a predicate"""
    for e in ev_list:
        if predicate(e):
            yield e


def select_from_list(ev_list, predicate):
    return list(_select_from_list(ev_list, predicate))


class SC2ReplayWrapper:
    def __init__(self, replay_file):
        self._replay = sc2reader.load_replay(replay_file)

    def _select_from_events(self, predicate):
        """ Select from the object's events list"""
        for e in select_from_list(self._replay.events, predicate):
            yield e

    def select_from_events(self, predicate):
        return list(self._select_from_events(predicate))

    def _select_from_game_events(self, predicate):
        """ Select from the object's game_events list"""
        for e in select_from_list(self._replay.game_events, predicate):
            yield e

    def select_from_game_events(self, predicate):
        return list(self._select_from_game_events(predicate))

    def categorize(self, event_list, category_map, value_map=None):
        values = {}
        ev = event_list
        for e in event_list:
            cat = category_map(e)
            if cat not in values:
                values[cat] = 0
            if cat is not None:
                if value_map is not None:
                    values[cat] += value_map(e)
                else:
                    values[cat] += 1
        return values

    def categorize_as_lists(self, event_list, category_map):
        categories = {}
        for e in event_list:
            cat = category_map(e)
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(e)
        return categories

    def bar_chart(self, selector, ev_list, category_map, value_map=None):
        assert (isinstance(ev_list, list))
        event_list = select_from_list(ev_list, selector)
        categories = self.categorize(event_list, category_map, value_map)
        plt.bar(categories.keys(), categories.values())
        plt.show()


def plot_locations(events, title):
    """Make a scatter plot of a list of events that have a location attribute.
    It can be a list of multiple event types, as long as they have a location
    attribute."""
    if len(events) == 0:
        raise Pysc2EmptyListError("plot_locations() needs a non-empty list")

    locations = np.array(list(map(lambda e: e.location, events)))
    x = locations[:, 0]
    y = locations[:, 1]

    plt.scatter(x, y)
    plt.title(title)
    plt.show()
