"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Mission {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
}

type PlayerClass = "Guerreiro" | "Arqueiro" | "Mago" | "Assassino";

interface Player {
  id: string;
  level: number;
  xp: number;
  gold: number;
  weapon: string | null;
  armor: string | null;
  artifact: string | null;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  mana: number;
  stat_points: number;
  streak: number;
  last_mission_date: string | null;
  class: PlayerClass;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  gold_cost: number;
}

interface ShopItem {
  id: string;
  item_name: string;
  item_type: string;
  rarity: string;
  attack_bonus: number;
  defense_bonus: number;
  mana_bonus: number;
  gold_cost: number;
}

interface InventoryItem {
  id: string;
  player_id: string;
  item_name: string;
  item_type: string;
}

const avatarClasse = {
  Guerreiro: "⚔️",
  Arqueiro: "🏹",
  Mago: "🧙",
  Assassino: "🥷",
} as const;

export default function Home() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [newMissionDescription, setNewMissionDescription] = useState("");
  const [newMissionXp, setNewMissionXp] = useState(100);
  const [newMissionDifficulty, setNewMissionDifficulty] = useState(1);
  const [player, setPlayer] = useState<Player | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedClass, setSelectedClass] =
    useState<PlayerClass>("Guerreiro");

  async function loadPlayer() {
    const { data, error } = await supabase
      .from("player")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setPlayer(data);
    }
  }

  async function loadMissions() {
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMissions(data);
    }
  }

  async function loadAchievements() {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at");

    if (!error && data) {
      setAchievements(data);
    }
  }

  async function loadRewards() {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("gold_cost");

    if (!error && data) {
      setRewards(data);
    }
  }

  async function loadShopItems() {
    const response = await supabase
      .from("inventory_items")
      .select("*");

    console.log("SHOP RESPONSE:", response);

    if (response.data) {
      setShopItems(response.data);
    }
  }

  async function loadInventory() {
    const { data, error } = await supabase
      .from("inventory")
      .select("*");

    if (!error && data) {
      setInventory(data);
    }
  }

  async function criarMissao() {
    if (!newMissionTitle.trim()) {
      alert("Digite o título da missão");
      return;
    }

    const { error } = await supabase
      .from("missions")
      .insert({
        title: newMissionTitle,
        description: newMissionDescription,
        difficulty: newMissionDifficulty,
        xp_reward: newMissionXp,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNewMissionTitle("");
    setNewMissionDescription("");
    setNewMissionXp(100);
    setNewMissionDifficulty(1);
    await loadMissions();
    alert("Missão criada!");
  }

  async function concluirMissao(mission: Mission) {
    if (!player) return;

    const novoXp = player.xp + mission.xp_reward;
    const novoGold = player.gold + 10;
    const novoLevel = Math.floor(novoXp / 100) + 1;

    const hoje = new Date().toISOString().split("T")[0];

    let novaSequencia = player.streak || 0;

    if (player.last_mission_date !== hoje) {
      novaSequencia += 1;
    }

    const levelsGanhos = novoLevel - player.level;

    const novosPontos =
      player.stat_points +
      (levelsGanhos > 0 ? levelsGanhos * 5 : 0);

    const { error } = await supabase
      .from("player")
      .update({
        xp: novoXp,
        gold: novoGold,
        level: novoLevel,
        stat_points: novosPontos,
        streak: novaSequencia,
        last_mission_date: hoje,
      })
      .eq("id", player.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPlayer();

    if (levelsGanhos > 0) {
      alert(
        `+${mission.xp_reward} XP\n\nLEVEL UP!\nNível ${novoLevel}\n+${levelsGanhos * 5} pontos de status`
      );
    } else {
      alert(`+${mission.xp_reward} XP`);
    }
  }

  async function aumentarAtributo(
    atributo:
      | "strength"
      | "agility"
      | "intelligence"
      | "vitality"
      | "mana"
  ) {
    if (!player) return;

    if (player.stat_points <= 0) {
      alert("Sem pontos disponíveis");
      return;
    }

    const novoValor = player[atributo] + 1;

    const { error } = await supabase
      .from("player")
      .update({
        [atributo]: novoValor,
        stat_points: player.stat_points - 1,
      })
      .eq("id", player.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPlayer();
  }

  async function resgatarRecompensa(reward: Reward) {
    if (!player) return;

    if (player.gold < reward.gold_cost) {
      alert("Gold insuficiente");
      return;
    }

    const novoGold = player.gold - reward.gold_cost;

    const { error } = await supabase
      .from("player")
      .update({
        gold: novoGold,
      })
      .eq("id", player.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPlayer();

    alert(`Recompensa resgatada: ${reward.title}`);
  }

  async function comprarItem(item: ShopItem) {
    if (!player) return;

    if (player.gold < item.gold_cost) {
      alert("Gold insuficiente");
      return;
    }

    const { error: inventoryError } = await supabase
      .from("inventory")
      .insert({
        item_name: item.item_name,
        item_type: item.item_type,
        rarity: item.rarity,
        attack_bonus: item.attack_bonus,
        defense_bonus: item.defense_bonus,
        mana_bonus: item.mana_bonus,
      });

    if (inventoryError) {
      alert(inventoryError.message);
      return;
    }

    const { error: playerError } = await supabase
      .from("player")
      .update({
        gold: player.gold - item.gold_cost,
      })
      .eq("id", player.id);

    if (playerError) {
      alert(playerError.message);
      return;
    }

    await loadPlayer();
    await loadInventory();

    alert(`${item.item_name} comprado!`);
  }

  async function equiparItem(item: InventoryItem) {
    if (!player) return;

    const updateData: any = {};

    if (item.item_type === "weapon") {
      updateData.weapon = item.item_name;
    }

    if (item.item_type === "armor") {
      updateData.armor = item.item_name;
    }

    if (item.item_type === "artifact") {
      updateData.artifact = item.item_name;
    }

    const { error } = await supabase
      .from("player")
      .update(updateData)
      .eq("id", player.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPlayer();

    alert(`${item.item_name} equipado!`);
  }

  async function alterarClasse() {
    if (!player) return;

    const { error } = await supabase
      .from("player")
      .update({
        class: selectedClass,
      })
      .eq("id", player.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPlayer();

    alert(`Classe alterada para ${selectedClass}`);
  }

  function getRank(level: number) {
    if (level >= 100) return "MONARCA";
    if (level >= 80) return "SS";
    if (level >= 60) return "S";
    if (level >= 40) return "A";
    if (level >= 25) return "B";
    if (level >= 15) return "C";
    if (level >= 5) return "D";
    return "E";
  }

  useEffect(() => {
    loadPlayer();
    loadMissions();
    loadAchievements();
    loadRewards();
    loadShopItems();
    loadInventory();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">

      <h1 className="text-5xl font-bold text-cyan-400 mb-8">
        ⚔️ SOLO SYSTEM
      </h1>

      {player && (
        <div className="border-2 border-cyan-400 rounded-xl p-6 mb-8 bg-zinc-800 shadow-lg shadow-cyan-500/20">
          <h2 className="text-2xl font-bold mb-4">
            {avatarClasse[player.class]} {player.class}
          </h2>

          <div className="flex gap-4 mb-6">
            <div>
              <p className="text-sm text-zinc-400">Rank</p>
              <p className="text-lg font-bold text-cyan-400">{getRank(player.level)}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-400">Lv.</p>
              <p className="text-lg font-bold">{player.level}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-400">💰 Gold</p>
              <p className="text-lg font-bold text-yellow-400">{player.gold}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-3xl">
                    {avatarClasse[player.class as keyof typeof avatarClasse]}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Avatar</p>
                    <p className="font-bold">{player.class}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span>⚔️ Classe</span>
                  <span className="text-purple-400">{player.class}</span>
                </div>

                <div className="flex justify-between">
                  <span>🏅 Rank</span>
                  <span className="text-cyan-400">{getRank(player.level)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>⭐ Nível</span>
                  <span>{player.level}</span>
                </div>

                <div className="flex justify-between">
                  <span>XP</span>
                  <span>{player.xp % 100}/100</span>
                </div>

                <div className="flex justify-between">
                  <span>💰 Gold</span>
                  <span>{player.gold}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <select
                value={selectedClass}
                onChange={(e) =>
                  setSelectedClass(e.target.value as PlayerClass)
                }
                className="text-black p-2 rounded"
              >
                <option value="Guerreiro">Guerreiro</option>
                <option value="Arqueiro">Arqueiro</option>
                <option value="Mago">Mago</option>
                <option value="Assassino">Assassino</option>
              </select>

              <button
                onClick={alterarClasse}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-white"
              >
                Alterar Classe
              </button>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">XP</span>
                <span className="text-sm font-semibold">{player.xp % 100}/100</span>
              </div>
              <div className="relative h-6 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 transition-all duration-300"
                  style={{
                    width: `${player.xp % 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm">❤️ HP: {player.vitality * 10}</p>
              <div className="w-full h-6 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-4 bg-red-500 rounded"
                  style={{
                    width: `${Math.min((player.vitality * 10) / 100, 1) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm">🔵 Mana: {player.mana * 10}</p>
              <div className="w-full h-6 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-4 bg-blue-500 rounded"
                  style={{
                    width: `${Math.min((player.mana * 10) / 100, 1) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-yellow-400 font-bold mt-2">
            Pontos disponíveis: {player.stat_points}
          </p>

          <p className="text-orange-400 font-bold">
            🔥 Sequência: {player.streak} dias
          </p>

          <div className="mt-4 grid md:grid-cols-3 gap-3">

            <div className="bg-zinc-800 border border-yellow-500 rounded-xl p-3">
              <p className="text-yellow-400">⚔️ Arma</p>
              <p>{player.weapon}</p>
            </div>

            <div className="bg-zinc-800 border border-blue-500 rounded-xl p-3">
              <p className="text-blue-400">🛡️ Armadura</p>
              <p>{player.armor}</p>
            </div>

            <div className="bg-zinc-800 border border-purple-500 rounded-xl p-3">
              <p className="text-purple-400">💎 Artefato</p>
              <p>{player.artifact}</p>
            </div>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">

            <div className="bg-zinc-800 border border-red-500 rounded-xl p-3 text-center">
              <p className="text-2xl">💪</p>
              <p className="text-sm text-zinc-400">Força</p>
              <p className="text-xl font-bold">{player.strength}</p>
              <button  onClick={() => aumentarAtributo("strength")}  className="mt-2 px-3 py-1 bg-red-500 rounded">  +</button>
            </div>

            <div className="bg-zinc-800 border border-yellow-500 rounded-xl p-3 text-center">
              <p className="text-2xl">⚡</p>
              <p className="text-sm text-zinc-400">Agilidade</p>
              <p className="text-xl font-bold">{player.agility}</p>
              <button  onClick={() => aumentarAtributo("agility")}  className="mt-2 px-3 py-1 bg-yellow-500 rounded">  +</button>
            </div>

            <div className="bg-zinc-800 border border-blue-500 rounded-xl p-3 text-center">
              <p className="text-2xl">🧠</p>
              <p className="text-sm text-zinc-400">Inteligência</p>
              <p className="text-xl font-bold">{player.intelligence}</p>
              <button  onClick={() => aumentarAtributo("intelligence")}  className="mt-2 px-3 py-1 bg-blue-500 rounded">  +</button>
            </div>

            <div className="bg-zinc-800 border border-pink-500 rounded-xl p-3 text-center">
              <p className="text-2xl">❤️</p>
              <p className="text-sm text-zinc-400">Vitalidade</p>
              <p className="text-xl font-bold">{player.vitality}</p>
              <button  onClick={() => aumentarAtributo("vitality")}  className="mt-2 px-3 py-1 bg-pink-500 rounded">  +</button>
            </div>

            <div className="bg-zinc-800 border border-cyan-500 rounded-xl p-3 text-center">
              <p className="text-2xl">🔵</p>
              <p className="text-sm text-zinc-400">Mana</p>
              <p className="text-xl font-bold">{player.mana}</p>
              <button  onClick={() => aumentarAtributo("mana")}  className="mt-2 px-3 py-1 bg-cyan-500 rounded">  +</button>
            </div>

          </div>
        </div>
      )}

      <div className="border border-cyan-400 rounded-xl p-4 mb-6">
        <h3 className="font-bold mb-3">
          ➕ Nova Missão
        </h3>
        <div className="grid gap-3">
          <input
            value={newMissionTitle}
            onChange={(e) => setNewMissionTitle(e.target.value)}
            placeholder="Título"
            className="text-black p-2 rounded"
          />
          <input
            value={newMissionDescription}
            onChange={(e) => setNewMissionDescription(e.target.value)}
            placeholder="Descrição"
            className="text-black p-2 rounded"
          />
          <input
            type="number"
            value={newMissionXp}
            onChange={(e) => setNewMissionXp(Number(e.target.value))}
            placeholder="XP"
            className="text-black p-2 rounded"
          />
          <input
            type="number"
            value={newMissionDifficulty}
            onChange={(e) => setNewMissionDifficulty(Number(e.target.value))}
            placeholder="Dificuldade"
            className="text-black p-2 rounded"
          />
          <button
            onClick={criarMissao}
            className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded"
          >
            Criar Missão
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        Missões
      </h2>

      <div className="space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="border border-cyan-400 rounded p-4"
          >
            <h3 className="font-bold text-xl">
              {mission.title}
            </h3>

            <p>{mission.description}</p>

            <p className="text-cyan-400 mt-2">
              XP: {mission.xp_reward}
            </p>

            <button
              onClick={() => concluirMissao(mission)}
              className="mt-3 bg-green-500 text-black px-4 py-2 rounded"
            >
              Concluir Missão
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Conquistas
        </h2>

        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="border border-yellow-400 rounded p-3"
            >
              <h3 className="font-bold text-yellow-400">
                {achievement.title}
              </h3>

              <p>{achievement.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Loja de Recompensas
        </h2>

        <div className="space-y-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="border border-green-400 rounded p-4"
            >
              <h3 className="font-bold text-green-400">
                {reward.title}
              </h3>

              <p>{reward.description}</p>

              <p className="mt-2">
                Custo: {reward.gold_cost} Gold
              </p>

              <button
                onClick={() => resgatarRecompensa(reward)}
                className="mt-2 bg-green-500 text-black px-4 py-2 rounded"
              >
                Resgatar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          🏪 Loja RPG
        </h2>

        <div className="space-y-4">
          {shopItems.map((item) => (
            <div
              key={item.id}
              className="border border-purple-500 rounded-xl p-4 bg-zinc-800"
            >
              <h3 className="font-bold text-purple-400">
                {item.item_name}
              </h3>

              <p>Tipo: {item.item_type}</p>
              <p>Raridade: {item.rarity}</p>

              <p className="text-green-400">
                💰 {item.gold_cost} Gold
              </p>

              <button
                onClick={() => comprarItem(item)}
                className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded"
              >
                Comprar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          🎒 Inventário
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="border border-purple-500 rounded-xl p-4 bg-zinc-800"
            >
              <h3 className="font-bold text-purple-400">
                {item.item_name}
              </h3>

              <p className="text-zinc-400">
                Tipo: {item.item_type}
              </p>

              <button
                onClick={() => equiparItem(item)}
                className="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded"
              >
                Equipar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}