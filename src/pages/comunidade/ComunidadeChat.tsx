// ============================================
// 🌐 COMUNIDADE - CHAT
// /comunidade/chat
// Acesso: NÃO PAGANTE + BETA + OWNER
// ============================================

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { MessageCircle, Send, Users, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const ComunidadeChat = memo(function ComunidadeChat() {
  const { skipAnimations, duration } = useOptimizedAnimations();
  const [message, setMessage] = useState('');
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  const channels = [
    { id: 1, name: 'geral', online: 45 },
    { id: 2, name: 'dúvidas', online: 23 },
    { id: 3, name: 'off-topic', online: 12 },
  ];

  const messages = [
    { id: 1, user: 'Maria', content: 'Alguém sabe explicar balanceamento?', time: '14:32' },
    { id: 2, user: 'João', content: 'Claro! É só igualar os átomos dos dois lados', time: '14:33' },
    { id: 3, user: 'Ana', content: 'Começa pelos metais, depois não-metais', time: '14:34' },
    { id: 4, user: 'Carlos', content: 'Deixa o H e O por último sempre', time: '14:35' },
    { id: 5, user: 'Maria', content: 'Valeu pessoal! Agora entendi 🎉', time: '14:36' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div {...animationProps} className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            Chat da Comunidade
          </h1>
          <p className="text-muted-foreground mt-2">
            Converse em tempo real com outros estudantes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
          {/* Channels Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Canais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {channel.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {channel.online}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-3 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                geral
                <span className="text-muted-foreground font-normal">• 45 online</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{msg.user[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{msg.user}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form 
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setMessage('');
                  }}
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
});

ComunidadeChat.displayName = 'ComunidadeChat';

export default ComunidadeChat;
