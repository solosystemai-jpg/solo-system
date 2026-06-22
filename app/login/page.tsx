"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function entrar() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="bg-zinc-800 p-6 rounded w-80">
        <h1 className="text-2xl font-bold text-white mb-4">
          Login
        </h1>

        <input
          className="w-full mb-3 p-2 rounded text-black"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-3 p-2 rounded text-black"
          placeholder="Senha"
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          onClick={entrar}
          className="w-full bg-cyan-500 text-black p-2 rounded"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}