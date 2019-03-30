#!/usr/bin/env python3

import pysc2
import json
from copy import deepcopy

REPLAY_FILE = 'replays/Harstem-vs-ShoWTimE-time1652.SC2Replay'
OUTPUT_PATH = 'datafiles/'
OUTPUT_FILE = 'unitcomposition_data2.json'


def generate_unitcounts(**kwargs):
    lifetime = kwargs.get('lifetime_dict')
    unit_counts = {}
    for unit in lifetime:
        unit_name = unit['unit_type']
        if unit_name not in unit_counts:
            unit_counts[unit_name] = []

    # print(unit_counts)


def generate_unitcomposition_data(**kwargs):
    replay = pysc2.SC2ReplayWrapper(kwargs.get('replay'))
    replay.categorize_unit_lifetime_events()
    categories = replay.categorize_unit_lifetime_events()
    processed_data = pysc2.match_events_to_units(categories)
    unitcomposition = pysc2.prepare_data_for_visualisation(processed_data)

    for key, value in unitcomposition.items():
        unit_lifetimes = value['unit_lifetimes']
        # print(value['unit_counts'])
        unit_counts = generate_unitcounts(lifetime_dict=unit_lifetimes)
        # value['unit_counts'] = [1,2,3]

    print(unitcomposition["p1"]['unit_counts'])

    # json.dumps(unitcomposition)
    with open(OUTPUT_PATH + kwargs.get('output'), 'w+') as f:
        f.write(json.dumps(unitcomposition, indent=2))


if __name__ == "__main__":
    generate_unitcomposition_data(
        replay=REPLAY_FILE,
        output=OUTPUT_FILE)
