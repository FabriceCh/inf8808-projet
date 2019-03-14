import sys
import sc2reader
from sc2reader.engine.plugins import SelectionTracker, APMTracker
from sc2reader.factories import SC2Factory

def printInformation(replay):
    print("category: " + replay.category)


def main():
    #path = sys.argv[1]
    path = 'C:/Users/fabrice/Documents/StarCraft II/Accounts/80372218/1-S2-1-3558622/Replays/Multiplayer/Abyssal Reef LE.SC2Replay'
    sc2reader.configure(debug=True)
    replay = sc2reader.load_replay(path, load_level=1)
    printInformation(replay)






    #sc2reader.configure(debug=True)
    #sc2reader.engine.register_plugin(SelectionTracker())
    #sc2reader.engine.register_plugin(APMTracker())
    #replay = sc2reader.load_replay('C:/Users/fabrice/Documents/StarCraft II/Accounts/80372218/1-S2-1-3558622/Replays/Multiplayer/Abyssal Reef LE.SC2Replay', load_level=1)
    #sc2reader.engine.run(replay)
    #print(replay)
if __name__ == '__main__':
    main()
