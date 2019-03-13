import unittest
import sc2reader
import pysc2
import matplotlib.pyplot as plt

class TestPysc2(unittest.TestCase):

    def __init__(self, methodName='runTest'):
        super(TestPysc2, self).__init__(methodName=methodName)
        # Note, not doing this in setUp() because I only need it to be done
        # once and we are never modifying the internal object.
        self.replay = pysc2.SC2ReplayWrapper('spawningtool_replays/dark_v_Solar_Game1_PortAleksanderLE.SC2Replay')

    def test_select_from_list(self):
        def selector(e):
            return True
        l = self.replay.select_from_list(self.replay._replay.game_events, selector)
        self.assertTrue(len(l) > 1000)

    def test_select_from_list_complex_selector(self):

        def selector(e):
            return isinstance(e, sc2reader.events.game.GetControlGroupEvent)
        l = self.replay.select_from_list(self.replay._replay.game_events, selector)
        self.assertIsInstance(l[0], sc2reader.events.game.GetControlGroupEvent)

    def test_bar_chart_get_list(self):
        def selector(e):
            return isinstance(e, sc2reader.events.game.GetControlGroupEvent)
        event_list = self.replay.select_from_list(self.replay._replay.game_events, selector)
        self.assertIsInstance(event_list[0], sc2reader.events.game.GetControlGroupEvent)

    def test_bar_chart(self):

        def selector(e):
            return isinstance(e, sc2reader.events.game.GetControlGroupEvent)

        def category_map(e):
            return e.control_group

        def value_map(e):
            return 1

        self.replay.bar_chart(
            selector=selector,
            ev_list=self.replay._replay.game_events,
            category_map=category_map
        )
