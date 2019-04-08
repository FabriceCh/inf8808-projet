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

    for born in born_events :
        id = get_unit_from_event(born)

        unit_died_events = select_events_related_to_unit(died_events, id)

        processed_data.append({
            'born': born,
            'died': unit_died_events[0] if unit_died_events else None,
        })

    for done in done_events:
        id = get_unit_from_event(done)

        unit_died_events = select_events_related_to_unit(died_events, id)
        processed_data.append({
            'born': done,
            'died': unit_died_events[0] if unit_died_events else None,
        })

    return sorted(processed_data, key=lambda u: u['born'].second)


def get_event_time(e: sc2reader.events.tracker.Event):
    pass
    return {'second': e.second, 'frame': e.frame}


def prepare_signle_unit_for_visualisation(unit_lifetime_events):
    """ Input: A dict like
    {
        born: A UnitBornEvent
        died: A UnitDiedEvent concerning the same unit
        init: A UnitDiedEvent concerning the same unit
        : A UnitDiedEvent concerning the same unit

        """
    prepared_datum = {}
    born_time = get_event_time(unit_lifetime_events['born'])
    prepared_datum['unit_type'] = unit_lifetime_events['born'].unit.name
    prepared_datum['born_time'] = born_time['second']

    # TODO Change this to get_died_time(unit_lifetime_events) which will look at
    #  all lifetime events, find the one that is not none, and use that as the
    #  died time.  Otherwise, the function should return the end-time of the
    #  game or a special value to indicate that the unit was never killed.
    died_time = get_event_time(unit_lifetime_events['died'])['second'] if unit_lifetime_events['died'] else 'EOG'
    prepared_datum['died_time'] = died_time
    prepared_datum['player'] = unit_lifetime_events['born'].unit.owner.team_id

    # Redundant data or other secondary stuff to add for whatever practical purposes
    prepared_datum['lifetime'] = {
        'born_time': born_time,
        'died_time': died_time
    }
    return prepared_datum


def prepare_data_for_visualisation(unit_lifetime_events):
    first_element = unit_lifetime_events[0]
    assert ('born' in first_element)
    prepared_lifetime_events = list(map(prepare_signle_unit_for_visualisation, unit_lifetime_events))

    # NOTE: Fun fact about generators, if I don't wrap the map in a list(), then
    #  p2_unit_lifetime_events will be empty.  Because map returns a generator,
    #  we use that in calculating the p1_unit_lifetime_events.  But that uses up
    #  the generator so the second one doesn't work.
    #  The simpler way would be to iterate using a for loop and putting each element
    #  in one list or the other as we read it.
    # I'm being overly cautious about turning everything into lists, but that is
    # because I like using the map, filter and other features of python, but for
    # the rest of you who haven't been bitten in the ass by having generators
    # instead of lists, it's better to hide the generators.
    lifetimes_by_player = [
        list(filter(lambda ule: ule['player'] == 1, prepared_lifetime_events)),
        list(filter(lambda ule: ule['player'] == 2, prepared_lifetime_events))
    ]

    # TODO Calculate total numbers of live units of each type, for each of the two preceding lists.
    #   This task involves some problem solving and since it is used to draw
    #   paths on a line graph, it can wait, I think.
    #  p1_unit_counts, p2_unit_counts
    # They should be of the form
    # p1_unit_counts = {
    #     "Zealot": [ ... #TODO Refise what should go into that list ],
    #     "Stalker: [ ... ],
    #     ...
    # }
    lifetimes = []
    for i in range(2):
        lifetimes.append({})
        for unit in lifetimes_by_player[i]:
            if unit['unit_type'] not in lifetimes[i]:
                lifetimes[i][unit['unit_type']] = []
            lifetimes[i][unit['unit_type']].append(
                [
                    unit['born_time'],
                    unit['died_time']
                ]
            )

    return {
        "players": [
            {
                'unit_lifetimes': lifetimes[0],
                'unit_counts': {}
            },
            {
                'unit_lifetimes': lifetimes[1],
                'unit_counts': {}
            }
        ]
    }


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
        valid_unit_names = [
            'Probe',
            'Zealot',
            'Sentry',
            'Stalker',
            'Adept',
            'HighTemplar',
            'DarkTemplar',
            'Archon',
            'Observer',
            'WarpPrism',
            'Immortal',
            'Colossus',
            'Disruptor',
            'Phoenix',
            'VoidRay',
            'Oracle',
            'Tempest',
            'Carrier',
            'Mothership'
        ]
        def selector(e):
            if hasattr(e, 'unit') and e.unit.name not in valid_unit_names:
                return False
            return (
                        (isinstance(e, sc2reader.events.UnitBornEvent)
                         and (e.control_pid == 1 or e.control_pid == 2)
                             # TODO Remove the true when we are sure that all the
                             #  names are good.  Leave it though so that the output
                             #  can show what the good and bad names are.
                         )
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
