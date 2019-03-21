import sc2reader
import matplotlib.pyplot as plt
import numpy as np

import sc2reader.events


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

def get_unit_from_event(e):
    return e.unit_id

def select_events_related_to_unit(event_list, unit_identifier):
    def selector(e):
        return get_unit_from_event(e) == unit_identifier

    return select_from_list(event_list, selector)


def match_events_to_units(categories):
    processed_data = []
    init_events = categories[sc2reader.events.tracker.UnitInitEvent]
    done_events = categories[sc2reader.events.tracker.UnitDoneEvent]
    born_events = categories[sc2reader.events.tracker.UnitBornEvent]
    died_events = categories[sc2reader.events.tracker.UnitDiedEvent]

    for born in born_events:
        id = get_unit_from_event(born)

        unit_init_events = select_events_related_to_unit(init_events, id)
        unit_done_events = select_events_related_to_unit(done_events, id)
        unit_died_events = select_events_related_to_unit(died_events, id)

        processed_data.append({
            'init': unit_init_events[0] if unit_init_events else None,
            'done': unit_done_events[0] if unit_done_events else None,
            'born': born,
            'died': unit_died_events[0] if unit_died_events else None,
        })

    return processed_data


def get_event_time(e: sc2reader.events.tracker.Event):
    pass
    return {'second': e.second, 'frame': e.frame}


def prepare_signle_unit_for_visualisation(unit_lifetime_events):
    prepared_datum = {}
    born_time = get_event_time(unit_lifetime_events['born'])
    prepared_datum['born_time'] = born_time

    died_time = get_event_time(unit_lifetime_events['died']) if unit_lifetime_events['died'] else None
    prepared_datum['died_time'] = died_time
    prepared_datum['lifetime'] = {
        'born_time': born_time,
        'died_time': died_time
    }
    return prepared_datum


def prepare_data_for_visualisation(unit_lifetime_events):
    first_element = unit_lifetime_events[0]
    assert ('born' in first_element)
    prepared_data = []
    for unit in unit_lifetime_events:
        prepared_data.append(prepare_signle_unit_for_visualisation(unit))
    return prepared_data

def categorize(event_list, category_map, value_map=None):
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

def categorize_as_lists(event_list, category_map):
    categories = {}
    for e in event_list:
        cat = category_map(e)
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(e)
    return categories

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



    def bar_chart(self, selector, ev_list, category_map, value_map=None):
        assert (isinstance(ev_list, list))
        event_list = select_from_list(ev_list, selector)
        categories = self.categorize(event_list, category_map, value_map)
        plt.bar(categories.keys(), categories.values())
        plt.show()

    def get_unit_lifetime_events(self):
        def selector(e):
            # TODO Refine this filtering to exclude everything real units produced by buildings
            return (
                    (isinstance(e, sc2reader.events.UnitBornEvent)
                     and (e.control_pid == 1 or e.control_pid == 2)
                     and not e.unit.name.startswith("Beacon"))
                    or isinstance(e, sc2reader.events.UnitInitEvent)
                    or isinstance(e, sc2reader.events.UnitDiedEvent)
                    or isinstance(e, sc2reader.events.UnitDoneEvent)
            )

        return self.select_from_events(predicate=selector)

    def categorize_unit_lifetime_events(self):
        def category_map(e):
            return type(e)

        return categorize_as_lists(self.get_unit_lifetime_events(), category_map)


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
