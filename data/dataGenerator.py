#!/usr/bin/env python3

import apmviz
import pysc2
import json
import pprint
from functools import reduce


REPLAY_FILE = 'replays/Harstem-vs-ShoWTimE-time1652.SC2Replay'
OUTPUT_PATH = '../frontend/datafiles/'
OUTPUT_FILE = 'data.json'
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


def generate_unit_composition_data(**kwargs):
    replay = pysc2.SC2ReplayWrapper(kwargs.get('replay'))
    replay.categorize_unit_lifetime_events()
    categories = replay.categorize_unit_lifetime_events()
    processed_data = pysc2.match_events_to_units(categories)

    unit_composition = pysc2.prepare_data_for_visualisation(processed_data)

    for key, value in unit_composition.items():
        unit_lifetimes = value['unit_lifetimes']
        unit_counts = generate_unitcounts(lifetime_dict=unit_lifetimes)
        value['unit_counts'] = unit_counts

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
        output=OUTPUT_FILE)

    generate_apm_data(
        replay=REPLAY_FILE,
        output=APM_OUTPUT_FILE
    )
