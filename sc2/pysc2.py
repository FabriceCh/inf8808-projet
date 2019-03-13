import sc2reader
import matplotlib.pyplot as plt
import numpy as np


class SC2ReplayWrapper:
    def __init__(self, replay_file):
        self._replay = sc2reader.load_replay(replay_file)

    def events_with_type(self, event_type, ev_list, pid=None):
        """ Generates a all the events of a certain type and optionally, we can
        select only those with a certain pid"""
        for event in self._replay.game_events:
            if isinstance(event, event_type):
                if pid:
                    if pid == event.player.pid:
                        yield event
                else:
                    yield event

    def select_from_list(self, ev_list, predicate):
        """Select all events from a list satisfying a predicate"""
        for e in ev_list:
            if predicate(e):
                yield e

    def select_events(self, predicate):
        """ Select from the object's events list"""
        for e in self.select_from_list(self._replay.events, predicate):
            yield e

    def select_game_events(self, predicate):
        """ Select from the object's game_events list"""
        for e in self.select_from_list(self._replay.game_events, predicate):
            yield e

    def categorize(self, event_list, category_map, value_map=None):
        values = {}
        ev = event_list
        for e in event_list:
                cat = category_map(e)
                if cat not in values:
                    values[cat] = 0
                if cat is not None:
                    if value_map is not None:
                        values[cat] += value_map(e)
                    else:
                        values[cat] += 1
        return values

    def bar_chart(self, selector, ev_list, category_map, value_map=None):
        assert(isinstance(ev_list, list))
        event_list = list(self.select_from_list(ev_list, selector))
        categories = self.categorize(event_list, category_map, value_map)
        plt.bar(categories.keys(), categories.values())
        plt.show()



def plot_locations(events, title):
    """Make a scatter plot of a list of events that have a location attribute.
    It can be a list of multiple event types, as long as they have a location
    attribute."""
    locations = np.array(list(map(lambda e:e.location, events)))
    try:
        plt.scatter(locations[:,0], locations[:,1])
        plt.title(title)
        plt.show()
    except:
        print("Empty List")

