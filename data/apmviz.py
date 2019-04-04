import unittest

import pysc2
import sc2reader
import sc2reader.events
import json


def replay_to_apm_data(replay_filename, output_filename):
    replay_wrapper = pysc2.SC2ReplayWrapper(
        replay_filename)

    apm_viz_data = assemble_apmviz_data(replay_wrapper)

    with open(output_filename, 'w+') as f:
        f.write(json.dumps(apm_viz_data, indent=2))


# TODO Remove this function from the other file later.
def event_to_dict(event):
    """ Take an event and return a serializble dictionary """

    # TODO Add things here
    d = {}
    d['type'] = event.name
    try:
        d['location'] = event.location
    except AttributeError:
        raise Exception("All events should have locations")

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

    try:
        d['player'] = event.control_pid
    except AttributeError:
        pass

    try:
        d['unit_id'] = event.unit_id
    except AttributeError:
        pass

    return d


def pre_serialize_event_list(events):
    """ Pre-serializing means transforming into a dict or a list that contains
    only serializable things.  So dicts of dicts or ints or strings or floats
    pretty much. """
    events_with_locations = assign_locations_to_events(events)
    return list(map(event_to_dict, events_with_locations))


def categorize_apm_events(events):
    command_types = [
        sc2reader.events.BasicCommandEvent,
        sc2reader.events.TargetUnitCommandEvent,
        sc2reader.events.TargetPointCommandEvent,
        sc2reader.events.DataCommandEvent
    ]
    command_map = {t: 'commands' for t in command_types}

    selection_types = [
        sc2reader.events.SetControlGroupEvent,
        sc2reader.events.GetControlGroupEvent,
        sc2reader.events.AddToControlGroupEvent,
        sc2reader.events.SelectionEvent
    ]
    selection_map = {t: 'selection' for t in selection_types}

    camera_types = [sc2reader.events.CameraEvent]
    camera_map = {t: 'camera' for t in camera_types}

    category_dict = {**command_map, **selection_map,
                     **camera_map}  # Merge the three preceding dictionaries

    def category_map(e):
        return category_dict.get(type(e), None)

    return pysc2.categorize_as_lists(events, category_map)


def get_first_location(events):
    for e in events:
        if isinstance(e, sc2reader.events.CameraEvent):
            return e.location
    else:
        return (0, 0)


def assign_locations_to_events(events):
    current_location = get_first_location(events)
    for e in events:
        if isinstance(e, sc2reader.events.CameraEvent):
            current_location = e.location

        if not hasattr(e, 'location'):
            e.location = current_location

    return events


def event_list_to_actions_per_second(event_list):
    d = {}
    for e in event_list:
        s = e.second
        if s not in d:
            d[s] = []
        d[s].append(e)

    # TODO Find the end of the game in a nicer way
    largest_second = 0
    for s in d:
        if s > largest_second:
            largest_second = s

    path_data = []
    for s in range(largest_second):
        path_data.append(len(d.get(s, [])))

    return path_data


def event_list_to_apms(events):
    """ Function to be used on the list of events of a certain category """

    categories = categorize_apm_events(events)

    for cat in categories:
        categories[cat] = event_list_to_actions_per_second(categories[cat])

    return categories


def assemble_player_data(replay_wrapper, player):
    # TODO Get all of the player's events
    player_events = replay_wrapper.get_player_events(player)
    player_game_events = replay_wrapper.get_player_game_events(player)

    event_data = pre_serialize_event_list(player_game_events)
    apm_data = event_list_to_apms(player_game_events)

    player_data = {
        'events': event_data,
        'apms': apm_data
    }
    return player_data


def assemble_apmviz_data(replay_wrapper):
    apm_viz_data = {
        'p1': assemble_player_data(replay_wrapper, player=1),
        'p2': assemble_player_data(replay_wrapper, player=2)
    }

    # TODO Investigate the discrepancy between this value and the one in the replay
    # _replay.game_length.seconds = 675
    # value we find here : 945
    # Since the value here is more practical, that is what I will put with the data.
    max_length = 0
    for p in ['p1', 'p2']:
        apms = apm_viz_data[p]['apms']
        for cat in apms:
            l = len(apms[cat])
            if l > max_length:
                max_length = l

    apm_viz_data['game_length'] = max_length

    return apm_viz_data


if __name__ == '__main__':
    from pprint import pprint

    replay_wrapper = pysc2.SC2ReplayWrapper(
        'replays/Neeb-vs-ShoWTimE-time1116.SC2Replay')
    apm_viz_data = assemble_apmviz_data(replay_wrapper)
    pprint(apm_viz_data['p1']['events'])
    import json
    json.dumps(apm_viz_data)
    with open('datafiles/actionstats/realdata.json', 'w+') as f:
        f.write(json.dumps(apm_viz_data, indent=2))
