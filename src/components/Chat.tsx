import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  conversationUserId: string;
  isAdmin?: boolean;
}

const Chat = ({ conversationUserId, isAdmin = false }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_user_id", conversationUserId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    load();

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat-${conversationUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_user_id=eq.${conversationUserId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return;
    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({
      conversation_user_id: conversationUserId,
      sender_id: user.id,
      content: newMsg.trim(),
    });

    if (!error) setNewMsg("");
    setSending(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border card-shadow flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-bold font-display text-sm">
          {isAdmin ? "Chat con usuario" : "Chat con tu entrenador"}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            {isAdmin
              ? "Envía un mensaje al usuario"
              : "¡Hola! Escribe aquí si tienes alguna duda sobre tu plan 💪"}
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMsg.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
