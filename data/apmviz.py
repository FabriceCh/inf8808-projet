import unittest

import pysc2

def replay_to_apm_data(replay_filename, output_filename):
    # Create replay

    # Call data extracting function

    # Write processed data to file

    pass

# TODO Remove this function from the other file later.
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

def pre_serialize_event_list(events):
    """ Pre-serializing means transforming into a dict or a list that contains
    only serializable things.  So dicts of dicts or ints or strings or floats
    pretty much. """
    return list(map(event_to_dict, events))

def event_list_to_apms(events):
    """ Function to be used on the list of events of a certain category """

    pass


def assemble_player_data(replay_wrapper, player):

    # TODO Get all of the player's events
    player_events = replay_wrapper.get_player_events(player)

    event_data = pre_serialize_event_list(player_events)
    apm_data = event_list_to_apms(player_events)

    player_data = {
        'events': event_data,
        'apms': apm_data
    }
    return player_data

def assemble_apmviz_data(replay_wrapper):

    apmviz_data = {
        'p1': assemble_player_data(replay_wrapper, player=1),
        'p2': assemble_player_data(replay_wrapper, player=2)
    }

    return apmviz_data


if __name__ == '__main__':
    from pprint import pprint
    replay_wrapper = pysc2.SC2ReplayWrapper('replays/Neeb-vs-ShoWTimE-time1116.SC2Replay')
    apm_viz_data = assemble_apmviz_data(replay_wrapper)
    import json
    json.dumps(apm_viz_data)
    with open('datafiles/actionstats/realdata.json', 'w+') as f:
        f.write(json.dumps(apm_viz_data, indent=2))
