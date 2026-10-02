import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authClient } from "@dashboard/login/authClient";
import { Button } from "@dashboard/componentes/ui/button";
import { Input } from "@dashboard/componentes/ui/input";
import { Label } from "@dashboard/componentes/ui/label";
import { UserPlus, Mail, Lock, Loader2, Link2, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@dashboard/componentes/ui/input-otp";
import AuthLayout from "@dashboard/login/AuthLayout";
import { toast } from "@dashboard/componentes/ui/use-toast";
import { safeReturnTo } from "@dashboard/login/authReturnTo";
import ChannelLinkDialog from "@dashboard/configuracao/Config_ChannelLinkDialog";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [linkPlatform, setLinkPlatform] = useState(null);
  const [pendingLinks, setPendingLinks] = useState([]);

  const handleLinkVerified = (data) => {
    const entry = { platform: data.platform, channelName: data.channelIdentifier, channelIdentifier: data.channelIdentifier, channelUrl: data.channelUrl, verifiedAt: data.verifiedAt, verificationProof: data.verificationProof, challengeKey: data.challengeKey };
    setPendingLinks(prev => {
      const next = [...prev.filter(p => p.platform !== data.platform), entry];
      try { localStorage.setItem("livenexus:pending-channels", JSON.stringify(next)); } catch {}
      return next;
    });
    setLinkPlatform(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.register({ email, password });
      if (result.activation_code) {
        setOtpCode(result.activation_code);
        toast({
          title: "Conta Criada",
          description: `Seu código de ativação é: ${result.activation_code}`,
          duration: 10000,
        });
      }
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authClient.verifyOtp({ email, otpCode });
      if (result?.token) {
        authClient.setToken(result.token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Código de verificação inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const result = await authClient.resendOtp(email);
      if (result.activation_code) {
        setOtpCode(result.activation_code);
        toast({
          title: "Novo código gerado",
          description: `Use o código: ${result.activation_code}`,
          duration: 10000,
        });
      } else {
        toast({
          title: "Código enviado",
          description: "Verifique seu e-mail para o novo código.",
        });
      }
    } catch (err) {
      setError(err.message || "Falha ao reenviar o código");
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verifique seu e-mail"
        subtitle={`Enviamos um código para ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Activation Hint */}
        {otpCode && (
          <div className="mb-6 text-center animate-pulse">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/60 font-bold mb-1">Ativação Instantânea</p>
            <p className="text-xs text-emerald-400/80">O seu código de ativação foi gerado e preenchido.</p>
          </div>
        )}

        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Reenviar
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Criar sua conta"
      subtitle="Junte-se ao Live Nexus e eleve suas lives"
      footer={
        <>
          Já tem conta?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/dashboard" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-sm font-medium text-slate-200">Vincule suas plataformas</p>
          <p className="text-[11px] text-muted-foreground mb-2">Opcional — você pode vincular depois no painel.</p>
          <div className="grid gap-2">
            {["Twitch", "Kick", "YouTube"].map(p => {
              const done = pendingLinks.find(l => l.platform === p);
              return (
                <div key={p} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-white">{p}</span>
                    {done && <span className="flex items-center gap-1 text-[11px] text-emerald-400 truncate"><ShieldCheck size={12}/> {done.channelIdentifier}</span>}
                  </div>
                  <button type="button" onClick={() => setLinkPlatform(p)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20">
                    {done ? "Trocar" : <><Link2 size={13}/> Vincular</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <ChannelLinkDialog open={!!linkPlatform} onOpenChange={(o) => !o && setLinkPlatform(null)} platform={linkPlatform || "Twitch"} onVerified={handleLinkVerified} />
    </AuthLayout>
  );
}
