import sc2reader
import matplotlib.pyplot as plt
import numpy as np

import sc2reader.events


class Pysc2Error(Exception):
    pass


class Pysc2EmptyListError(Pysc2Error):
    pass


supply_per_unit = {
    'Adept': 2,
    'Archon': 4,
    'Carrier': 6,
    'Colossus': 6,
    'DarkTemplar': 2,
    'Disruptor': 3,
    'HighTemplar': 2,
    'Immortal': 4,
    'Mothership': 8,
    'Observer': 1,
    'Oracle': 3,
    'Phoenix': 2,
    'Probe': 1,
    'Sentry': 2,
    'Stalker': 2,
    'VoidRay': 4,
    'WarpPrism': 2,
    'Zealot': 2,
    'Tempest': 5
}

protoss_unit_list = [
    'Adept',
    'Archon',
    'Carrier',
    'Colossus',
    'DarkTemplar',
    'Disruptor',
    'HighTemplar',
    'Immortal',
    'Mothership',
    'Observer',
    'Oracle',
    'Phoenix',
    'Probe',
    'Sentry',
    'Stalker',
    'VoidRay',
    'WarpPrism',
    'Zealot',
    'Tempest'
]

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

    done_events = categories[sc2reader.events.tracker.UnitDoneEvent]
    born_events = categories[sc2reader.events.tracker.UnitBornEvent]
    died_events = categories[sc2reader.events.tracker.UnitDiedEvent]

    def find_match_from_unit(event, event_list):
        id = get_unit_from_event(event)
        unit_died_events = select_events_related_to_unit(event_list, id)
        return unit_died_events[0] if unit_died_events else None

    return map(lambda e: {
        'born': e,
        'died': find_match_from_unit(e, died_events)
    }, sorted(born_events + done_events, key= lambda e: e.second) )


def get_event_time(e: sc2reader.events.tracker.Event):
    return {'second': e.second, 'frame': e.frame}


def prepare_signle_unit_for_visualisation(unit_lifetime_events):

    born_time = get_event_time(unit_lifetime_events['born'])['second']
    died_time = get_event_time(unit_lifetime_events['died'])['second'] if unit_lifetime_events['died'] else 'EOG'
    prepared_datum = {
        'unit_type' : unit_lifetime_events['born'].unit.name,
        'born_time' : born_time,
        'died_time' : died_time,
        'player' : unit_lifetime_events['born'].unit.owner.team_id,
        'lifetime' : [born_time, died_time]
    }
    return prepared_datum


def group_unit_lifetimes_by_player_and_unit_type(unit_lifetime_events):
    prepared_lifetime_events = list(map(prepare_signle_unit_for_visualisation, unit_lifetime_events))

    lifetimes_by_player = [
        list(filter(lambda ule: ule['player'] == 1, prepared_lifetime_events)),
        list(filter(lambda ule: ule['player'] == 2, prepared_lifetime_events))
    ]

    def group_unit_lifetimes_by_unit(unit_lifetimes):
        lifetimes_by_unit = {}
        for unit in unit_lifetimes:
            if unit['unit_type'] not in lifetimes_by_unit:
                lifetimes_by_unit[unit['unit_type']] = []
            # Lifetime to interval
            lifetimes_by_unit[unit['unit_type']].append(unit['lifetime'])
        return lifetimes_by_unit

    return list(map(
        lambda player: { 'unit_lifetimes': group_unit_lifetimes_by_unit(player), 'unit_counts': {}},
        lifetimes_by_player
    ))


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

def event_to_dict(event):
    """ Take an event and return a serializble dictionary """

    # TODO Add things here
    d = {}
    d['type'] = event.name
    try:
        d['location'] = event.location
    except AttributeError:
        d['location'] = 'Not Yet Implemented'

    try:
        d['second'] = event.second
    except AttributeError:
        d['second'] = 'Event has no timestamp'

    try:
        d['unit'] = {
            'id': event.unit.id,
            'name': event.unit.name
        }
    except AttributeError:
        pass

    d['player'] = event.control_pid
    d['unit_id'] = event.unit_id

    return d



class SC2ReplayWrapper:
    def __init__(self, replay_file):
        self._replay = sc2reader.load_replay(replay_file)

    def produce_data_for_apm_viz(self):
        # TODO Get event list

        # TODO Map events to json
        pass

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

    def get_player_events(self, player):
        excluded_event_types = [
            sc2reader.events.PlayerSetupEvent,
            sc2reader.events.PlayerLeaveEvent,
            sc2reader.events.PlayerStatsEvent,
        ]
        def selector(e):
            return hasattr(e, 'control_pid') and e.control_pid == player
        return self.select_from_events(predicate=selector)

    def _get_player_game_events(self, player):
        # Note this list also exists implicitly in apmviz.py in event_list_to_apms()
        relevant_event_types = [
            sc2reader.events.BasicCommandEvent,
            sc2reader.events.TargetUnitCommandEvent,
            sc2reader.events.TargetPointCommandEvent,
            sc2reader.events.DataCommandEvent,
            sc2reader.events.SetControlGroupEvent,
            sc2reader.events.GetControlGroupEvent,
            sc2reader.events.AddToControlGroupEvent,
            sc2reader.events.SelectionEvent,
            sc2reader.events.CameraEvent]
        for e in self._replay.game_events:
            if e.player.pid == player and type(e) in relevant_event_types:
                yield e

    def get_player_game_events(self, player):
        return list(self._get_player_game_events(player))


    def bar_chart(self, selector, ev_list, category_map, value_map=None):
        assert (isinstance(ev_list, list))
        event_list = select_from_list(ev_list, selector)
        categories = categorize(event_list, category_map, value_map)
        plt.bar(categories.keys(), categories.values())
        plt.show()

    def get_unit_lifetime_events(self):
        unit_lifetime_event_types = [
            sc2reader.events.UnitBornEvent,
            sc2reader.events.UnitInitEvent,
            sc2reader.events.UnitDiedEvent,
            sc2reader.events.UnitDoneEvent
        ]

        def selector(e):
            return (type(e) in unit_lifetime_event_types
                    and hasattr(e, 'unit')
                    and e.unit.name in protoss_unit_list)

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
