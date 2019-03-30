#!/usr/bin/env python3

import pysc2
import json


replay_filename = 'replays/Harstem-vs-ShoWTimE-time1652.SC2Replay'
replay = pysc2.SC2ReplayWrapper(replay_filename)


def generate_unitcomposition_data():
    replay.categorize_unit_lifetime_events()
    categories = replay.categorize_unit_lifetime_events()
    processed_data = pysc2.match_events_to_units(categories)
    post_post_processed = pysc2.prepare_data_for_visualisation(processed_data)

    json.dumps(post_post_processed)
    with open('datafiles/unitcomposition/mydata.json', 'w+') as f:
        f.write(json.dumps(post_post_processed, indent=2))
    pass


if __name__ == "__main__":
    generate_unitcomposition_data()
