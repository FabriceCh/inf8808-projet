import unittest
import sc2reader
import pysc2
from pprint import pprint
import matplotlib.pyplot as plt

# THis helps the IDE
import sc2reader.events
import sc2reader.events.game

class TestDataGathering(unittest.TestCase):

    def __init__(self, methodName='runTest'):
        super(TestDataGathering, self).__init__(methodName=methodName)
        self.replay = pysc2.SC2ReplayWrapper('spawningtool_replays/dark_v_Solar_Game1_PortAleksanderLE.SC2Replay')

    def test_process_unit_lifetime_events(self):
        categories = self.replay.process_unit_lifetime_events()
        pprint(categories)
