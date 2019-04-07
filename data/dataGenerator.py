#!/usr/bin/env python3

import apmviz
import pysc2
import json
import pprint
import os
from functools import reduce

THIS_DIR = os.path.dirname(os.path.realpath(__file__))
REPLAY_PATH = THIS_DIR + '/replays'
OUTPUT_PATH = os.path.normpath(THIS_DIR + '/' + '../frontend/datafiles/')

pp = pprint.PrettyPrinter(indent=4)


def get_last_death(lifetime_dict):
    death_info_list = list(map(lambda u: u.get('died_time'), lifetime_dict))
    death_time_list = list(map(lambda x: x.get('second'),
                               filter(lambda x: isinstance(x, dict),
                                      death_info_list)))
    last_death = reduce(lambda x, y: max(x, y), death_time_list)
    return last_death


def generate_unitcounts(**kwargs):
    lifetime = kwargs.get('lifetime_dict')
    last_death = get_last_death(lifetime)
    unit_counts = {}
    for unit in lifetime:
        unit_name = unit['unit_type']
        if unit_name not in unit_counts:
            unit_counts[unit_name] = []
        # print(unit)

    # pp.pprint(unit_counts)
    return unit_counts


def lifetime_list_to_unit_counts(lifetime_list, duration):
    born_time = 0
    died_time = 1
    counts = []
    for i in range(duration):
        count = 0
        for u in lifetime_list:
            if u[born_time] <= i < u[died_time]:
                count += 1;
        counts.append(count)

    return counts


def unit_lifetimes_to_unit_counts(unit_lifetimes, duration):
    unit_counts = {}
    for unit in unit_lifetimes:
        lifetime_list = unit_lifetimes[unit]
        counts = lifetime_list_to_unit_counts(lifetime_list, duration)
        unit_counts[unit] = counts

    # return unit_counts

    return {unit: lifetime_list_to_unit_counts(unit_lifetimes[unit], duration)
            for unit in unit_lifetimes}


def add_empties_for_missing_units_quick_fix(data):
    unit_list = [
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

    for player_data in data['players']:
        unit_lifetimes = player_data['unit_lifetimes']
        unit_counts = player_data['unit_counts']
        for unit_name in unit_list:
            if unit_name not in unit_lifetimes:
                unit_lifetimes[unit_name] = []
            if unit_name not in unit_counts:
                unit_counts[unit_name] = [0] * data['duration']


def replace_eog_with_duration(data, duration):
    for player_data in data['players']:
        for unit in player_data['unit_lifetimes']:
            lifetimes = player_data['unit_lifetimes'][unit]
            for lifetime in lifetimes:
                if lifetime[1] == 'EOG':
                    lifetime[1] = duration


def generate_metadata(replay_wrapper):
    metadata = {
        'players' : [
            { 'name': replay_wrapper._replay.teams[0].players[0].name, },
            { 'name': replay_wrapper._replay.teams[1].players[0].name, },
        ],
        'winner': {
            'name': replay_wrapper._replay.winner.players[0].name,
            'id': replay_wrapper._replay.winner.players[0].team_id
        }
    }
    return metadata


def generate_unit_composition_data(**kwargs):
    """
    Generates a json with this format:
    {
        "players": [
            {
                "unit_lifetimes": {...}
                "unit_counts": {...}
            },
            {
                "unit_lifetimes": {...}
                "unit_counts": {...}
            }
        ],
        "units": [
            { "id": "Probe", name: "Probe", ... },
            ...
        ]
        "duration": 42
    }
    """
    replay = pysc2.SC2ReplayWrapper(kwargs.get('replay'))
    replay.categorize_unit_lifetime_events()
    categories = replay.categorize_unit_lifetime_events()
    processed_data = pysc2.match_events_to_units(categories)

    unit_composition = pysc2.prepare_data_for_visualisation(processed_data)

    duration = replay._replay.events[-1].second
    unit_composition['duration'] = duration

    replace_eog_with_duration(unit_composition, duration)

    for player in unit_composition['players']:
        player_unit_lifetimes = player['unit_lifetimes']
        player['unit_counts'] = unit_lifetimes_to_unit_counts(
            player_unit_lifetimes, unit_composition['duration'])

    add_empties_for_missing_units_quick_fix(unit_composition)

    unit_composition['metadata'] = generate_metadata(replay_wrapper=replay)

    with open(kwargs.get('output'), 'w+') as f:
        f.write(json.dumps(unit_composition, indent=2))

    # pp.pprint(unit_composition['p1']['unit_counts'])


def generate_apm_data(**kwargs):
    replay_filename=kwargs.get('replay')
    output_filename=kwargs.get('output')

    replay_wrapper = pysc2.SC2ReplayWrapper(replay_filename)

    apm_viz_data = apmviz.assemble_apmviz_data(replay_wrapper)
    apm_viz_data['metadata'] = generate_metadata(replay_wrapper=replay_wrapper)

    with open(output_filename, 'w+') as f:
        f.write(json.dumps(apm_viz_data, indent=2))



def generate_replay_data(**kwargs):
    replay = kwargs.get('replay')
    output_path = kwargs.get('output_path')
    replay_file = os.path.basename(replay)
    output_prefix = os.path.join(output_path, replay_file.split('.')[0])

    generate_unit_composition_data(
        replay=replay,
        output=output_prefix + '_unit.json'
    )

    generate_apm_data(
        replay=replay,
        output=output_prefix + '_apm.json'
    )


def _replays_from_dir(replay_dir):
    for filename in os.listdir(replay_dir):
        assert (isinstance(filename, str))
        if filename.lower().endswith('.sc2replay'):
            yield replay_dir + '/' + filename


def replays_from_dir(replay_dir):
    return list(_replays_from_dir(replay_dir))


def generate_all_data(replay_path, output_path):
    for replay_file in replays_from_dir(replay_path):
        generate_replay_data(
            replay=replay_file,
            output_path=output_path
        )

if __name__ == "__main__":
    generate_all_data(
        replay_path=REPLAY_PATH,
        output_path=OUTPUT_PATH
    )
