#!/usr/bin/env python3

import pysc2
import json

REPLAY_FILE = 'replays/Harstem-vs-ShoWTimE-time1652.SC2Replay'
OUTPUT_PATH = 'datafiles/'
OUTPUT_FILE = 'unitcomposition_data.json'


def generate_unitcomposition_data(**kwargs):
    replay = pysc2.SC2ReplayWrapper(kwargs.get('replay'))
    replay.categorize_unit_lifetime_events()
    categories = replay.categorize_unit_lifetime_events()
    processed_data = pysc2.match_events_to_units(categories)
    post_post_processed = pysc2.prepare_data_for_visualisation(processed_data)

    json.dumps(post_post_processed)
    with open(OUTPUT_PATH + kwargs.get('output'), 'w+') as f:
        f.write(json.dumps(post_post_processed, indent=2))
    pass


if __name__ == "__main__":
    generate_unitcomposition_data(
        replay=REPLAY_FILE,
        output=OUTPUT_FILE)
