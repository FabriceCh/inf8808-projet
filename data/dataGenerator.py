#!/usr/bin/env python3

import apmviz
import pysc2
import json
import pprint
from functools import reduce


REPLAY_FILE = 'replays/Harstem-vs-ShoWTimE-time1652.SC2Replay'
OUTPUT_PATH = '../frontend/datafiles/'
UNIT_OUTPUT_FILE = 'unit_data.json'
APM_OUTPUT_FILE = OUTPUT_PATH + 'action_stats_data.json'

pp = pprint.PrettyPrinter(indent=4)


def get_last_death(lifetime_dict):
    death_info_list = list(map(lambda u: u.get('died_time'), lifetime_dict))
    death_time_list = list(map(lambda x: x.get('second'), filter(lambda x: isinstance(x, dict), death_info_list)))
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
        'Phoenix',
        'Probe',
        'Sentry',
        'Stalker',
        'VoidRay',
        'WarpPrism',
        'Zealot',
        'tempest'
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
        player['unit_counts'] = unit_lifetimes_to_unit_counts(player_unit_lifetimes, unit_composition['duration'])


    add_empties_for_missing_units_quick_fix(unit_composition)

    with open(OUTPUT_PATH + kwargs.get('output'), 'w+') as f:
        f.write(json.dumps(unit_composition, indent=2))

    # pp.pprint(unit_composition['p1']['unit_counts'])


def generate_apm_data(**kwargs):
    apmviz.replay_to_apm_data(
        replay_filename=kwargs.get('replay'),
        output_filename=kwargs.get('output')
    )


if __name__ == "__main__":
    generate_unit_composition_data(
        replay=REPLAY_FILE,
        output=UNIT_OUTPUT_FILE)

    generate_apm_data(
        replay=REPLAY_FILE,
        output=APM_OUTPUT_FILE
    )
