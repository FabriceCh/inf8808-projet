import unittest
import sc2reader
import pysc2
import matplotlib.pyplot as plt

# THis helps the IDE
import sc2reader.events
import sc2reader.events.game

class TestPysc2(unittest.TestCase):

    def __init__(self, methodName='runTest'):
        super(TestPysc2, self).__init__(methodName=methodName)
        # Note, not doing this in setUp() because I only need it to be done
        # once and we are never modifying the internal object.
        self.replay = pysc2.SC2ReplayWrapper('spawningtool_replays/dark_v_Solar_Game1_PortAleksanderLE.SC2Replay')

    def test__select_from_list(self):
        def selector(e):
            return True
        gen = pysc2.select_from_list(self.replay._replay.game_events, selector)
        l = list(gen)
        self.assertTrue(len(l) > 1000)

    def test_select_from_list(self):
        def selector(e):
            return True
        l = pysc2.select_from_list(self.replay._replay.game_events, selector)
        self.assertTrue(len(l) > 1000)


    def test_select_from_game_events(self):
        event_list = self.replay.select_from_game_events(lambda e: isinstance(e, sc2reader.events.game.GetControlGroupEvent))
        self.assertIsInstance(event_list[0], sc2reader.events.game.GetControlGroupEvent)

    def test_select_from_events(self):
        def selector(e):
            return isinstance(e, sc2reader.events.UnitBornEvent)

        event_list = self.replay.select_from_events(selector)

        self.assertIsInstance(event_list[0], sc2reader.events.UnitBornEvent)
        self.assertTrue(len(event_list) > 80)

    def test_select_from_list_complex_selector(self):

        def selector(e):
            return isinstance(e, sc2reader.events.game.GetControlGroupEvent)
        l = pysc2.select_from_list(self.replay._replay.game_events, selector)
        self.assertIsInstance(l[0], sc2reader.events.game.GetControlGroupEvent)

    def test_categorize(self):

        def selector(e):
            return isinstance(e, sc2reader.events.game.GetControlGroupEvent)
        def category_map(e):
            return e.control_group
        event_list = self.replay.select_from_game_events(selector)

        categories = pysc2.categorize(event_list, category_map=category_map)

        self.assertTrue(categories[1] > 800)

        def value_map(e):
            return 2
        categories = pysc2.categorize(event_list, category_map=category_map, value_map=value_map)
        self.assertTrue(categories[1] > 1600)

    def test_categorize_as_lists(self):
        def selector(e):
            return isinstance(e, sc2reader.events.game.GetControlGroupEvent)
        def category_map(e):
            return e.control_group
        event_list = self.replay.select_from_game_events(selector)

        category_counts = pysc2.categorize(event_list, category_map)
        categorized_events = pysc2.categorize_as_lists(event_list, category_map)

        self.assertTrue(len(categorized_events[2]) == category_counts[2])


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

    def test_plot_locations(self):
        event_list = self.replay.select_from_game_events(lambda e: isinstance(e, sc2reader.events.game.CameraEvent))

        pysc2.plot_locations(event_list, "Title for the plot that I made so easily")

        self.assertRaises(pysc2.Pysc2EmptyListError, pysc2.plot_locations, [], "Should not print")

    def test_open_competitive_replay(self):
        path = './replays/pvpGame1.SC2Replay'
        self.replay = pysc2.SC2ReplayWrapper(path)
