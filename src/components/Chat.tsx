import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Image, Video, X, Play } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string; type: "image" | "video" } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewMedia, setViewMedia] = useState<{ url: string; type: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_user_id", conversationUserId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    load();

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

  const uploadMedia = async (file: File): Promise<{ url: string; type: "image" | "video" }> => {
    const ext = file.name.split(".").pop() || "jpg";
    const mediaType = file.type.startsWith("video") ? "video" : "image";
    const path = `chat/${conversationUserId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("progress-photos")
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("progress-photos")
      .getPublicUrl(path);

    return { url: urlData.publicUrl, type: mediaType };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("video") ? "video" : "image";
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, url, type });
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendMessage = async () => {
    if ((!newMsg.trim() && !previewFile) || !user) return;
    setSending(true);
    setUploading(!!previewFile);

    try {
      let media_url: string | null = null;
      let media_type: string | null = null;

      if (previewFile) {
        const result = await uploadMedia(previewFile.file);
        media_url = result.url;
        media_type = result.type;
      }

      const { error } = await supabase.from("chat_messages").insert({
        conversation_user_id: conversationUserId,
        sender_id: user.id,
        content: newMsg.trim() || (media_type === "video" ? "📹 Video" : "📷 Foto"),
        media_url,
        media_type,
      });

      if (!error) {
        setNewMsg("");
        setPreviewFile(null);
      }
    } catch (err: any) {
      toast.error("Error al enviar: " + (err.message || ""));
    }
    setSending(false);
    setUploading(false);
  };

  return (
    <>
      <div className="bg-card rounded-2xl border border-border card-shadow flex flex-col h-[500px]">
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
                : "¡Hola! Escribe aquí si tienes alguna duda sobre tu plan. También puedes enviar fotos y vídeos de tu progreso 💪📸"}
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
                  {/* Media */}
                  {msg.media_url && msg.media_type === "image" && (
                    <button
                      onClick={() => setViewMedia({ url: msg.media_url!, type: "image" })}
                      className="block mb-2 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={msg.media_url}
                        alt="Foto"
                        className="max-w-full max-h-48 rounded-lg object-cover"
                      />
                    </button>
                  )}
                  {msg.media_url && msg.media_type === "video" && (
                    <button
                      onClick={() => setViewMedia({ url: msg.media_url!, type: "video" })}
                      className="block mb-2 rounded-lg overflow-hidden relative group"
                    >
                      <video src={msg.media_url} className="max-w-full max-h-48 rounded-lg object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    </button>
                  )}
                  {/* Text (hide generic labels if media is present) */}
                  {(!msg.media_url || (msg.content !== "📷 Foto" && msg.content !== "📹 Video")) && (
                    <span>{msg.content}</span>
                  )}
                  <div className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Preview */}
        {previewFile && (
          <div className="px-3 pt-2 flex items-center gap-2">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              {previewFile.type === "image" ? (
                <img src={previewFile.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Video className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              {previewFile.type === "image" ? "📷 Foto lista" : "📹 Vídeo listo"}
            </span>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              className="shrink-0"
              disabled={uploading}
            >
              <Image className="w-5 h-5" />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sending || (!newMsg.trim() && !previewFile)}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Media Viewer */}
      {viewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewMedia(null)}
        >
          <button
            onClick={() => setViewMedia(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl max-h-[85vh]">
            {viewMedia.type === "image" ? (
              <img src={viewMedia.url} alt="" className="max-h-[85vh] rounded-xl object-contain" />
            ) : (
              <video src={viewMedia.url} controls autoPlay className="max-h-[85vh] rounded-xl" />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
