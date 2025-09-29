import axios, { AxiosInstance } from 'axios';
import { GameState } from '../../shared/types';

export class LCUService {
  private client: AxiosInstance;
  private isConnected = false;
  private port = 0;
  private password = '';

  constructor() {
    this.client = axios.create({
      timeout: 5000,
      httpsAgent: {
        rejectUnauthorized: false
      }
    });
  }

  private async findLCUConnection(): Promise<boolean> {
    try {
      const lockfilePath = process.platform === 'win32' 
        ? `${process.env.LOCALAPPDATA}/Riot Games/League of Legends/lockfile`
        : '/tmp/riot-lcu.lockfile';

      const fs = require('fs');
      const lockfile = fs.readFileSync(lockfilePath, 'utf8');
      const [name, pid, port, password, protocol] = lockfile.split(':');
      
      this.port = parseInt(port);
      this.password = password;
      
      this.client.defaults.baseURL = `https://127.0.0.1:${this.port}`;
      this.client.defaults.auth = {
        username: 'riot',
        password: this.password
      };

      await this.client.get('/lol-summoner/v1/current-summoner');
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async getGameState(): Promise<GameState | null> {
    if (!this.isConnected) {
      const connected = await this.findLCUConnection();
      if (!connected) {
        throw new Error('LCU not connected');
      }
    }

    try {
      const [gameStatsResponse, gameTimeResponse] = await Promise.all([
        this.client.get('/liveclientdata/gamestats'),
        this.client.get('/liveclientdata/gametime')
      ]);

      const activePlayerResponse = await this.client.get('/liveclientdata/activeplayer');
      const allGameDataResponse = await this.client.get('/liveclientdata/allgamedata');

      const gameStats = gameStatsResponse.data;
      const gameTime = gameTimeResponse.data;
      const activePlayer = activePlayerResponse.data;
      const allGameData = allGameDataResponse.data;

      const objectives = this.parseObjectives(allGameData);
      const goldData = this.parseGoldData(allGameData);

      return {
        isInGame: true,
        gameTime: Math.floor(gameTime),
        playerChampion: activePlayer.championStats.championName,
        playerGold: activePlayer.currentGold,
        playerLevel: activePlayer.level,
        objectives,
        teamGold: goldData.teamGold,
        enemyGold: goldData.enemyGold
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          isInGame: false,
          gameTime: 0,
          playerChampion: '',
          playerGold: 0,
          playerLevel: 1,
          objectives: {
            dragon: { spawnsAt: 300, type: 'unknown' },
            baron: { spawnsAt: 1200 },
            herald: { spawnsAt: 480 }
          },
          teamGold: 0,
          enemyGold: 0
        };
      }
      throw error;
    }
  }

  private parseObjectives(gameData: any) {
    const currentTime = Math.floor(gameData.gameTime);
    
    return {
      dragon: {
        spawnsAt: this.calculateNextObjectiveSpawn('dragon', currentTime, gameData),
        type: 'elemental'
      },
      baron: {
        spawnsAt: this.calculateNextObjectiveSpawn('baron', currentTime, gameData)
      },
      herald: {
        spawnsAt: this.calculateNextObjectiveSpawn('herald', currentTime, gameData)
      }
    };
  }

  private calculateNextObjectiveSpawn(objective: string, currentTime: number, gameData: any): number {
    switch (objective) {
      case 'dragon':
        if (currentTime < 300) return 300;
        return Math.ceil((currentTime - 300) / 300) * 300 + 300;
      case 'baron':
        return Math.max(1200, currentTime + 420);
      case 'herald':
        if (currentTime < 480) return 480;
        if (currentTime < 1200) return 480;
        return -1;
      default:
        return 0;
    }
  }

  private parseGoldData(gameData: any) {
    let teamGold = 0;
    let enemyGold = 0;

    if (gameData.allPlayers) {
      const playerTeam = gameData.allPlayers.find((p: any) => 
        p.championName === gameData.activePlayer.championStats.championName
      )?.team;

      gameData.allPlayers.forEach((player: any) => {
        if (player.team === playerTeam) {
          teamGold += player.currentGold || 0;
        } else {
          enemyGold += player.currentGold || 0;
        }
      });
    }

    return { teamGold, enemyGold };
  }
}