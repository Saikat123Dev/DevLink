'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronLeft,
  Image,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Settings,
  Star,
  Users,
  Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  isArchived: boolean;
  isPinned: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthLoading(false);
      fetchConversations();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockConversations: Conversation[] = [
        {
          id: '1',
          type: 'direct',
          participants: [{
            id: '2',
            name: 'Sarah Chen',
            email: 'sarah@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            isOnline: true
          }],
          lastMessage: {
            id: 'm1',
            content: 'Hey, how\'s the React project coming along?',
            senderId: '2',
            sender: {
              id: '2',
              name: 'Sarah Chen',
              email: 'sarah@example.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
              isOnline: true
            },
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            type: 'text',
            isRead: false
          },
          unreadCount: 3,
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isArchived: false,
          isPinned: true
        },
        {
          id: '2',
          type: 'group',
          name: 'DevLink Mobile Team',
          participants: [
            {
              id: '3',
              name: 'Alex Rodriguez',
              email: 'alex@example.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
              isOnline: false,
              lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '4',
              name: 'Emily Watson',
              email: 'emily@example.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
              isOnline: true
            }
          ],
          lastMessage: {
            id: 'm2',
            content: 'Great work on the UI components! 🎉',
            senderId: '4',
            sender: {
              id: '4',
              name: 'Emily Watson',
              email: 'emily@example.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
              isOnline: true
            },
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'text',
            isRead: true
          },
          unreadCount: 0,
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isArchived: false,
          isPinned: false
        },
        {
          id: '3',
          type: 'direct',
          participants: [{
            id: '5',
            name: 'Michael Chang',
            email: 'michael@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
            isOnline: false,
            lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }],
          lastMessage: {
            id: 'm3',
            content: 'Thanks for the code review feedback!',
            senderId: '1',
            sender: user!,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            type: 'text',
            isRead: true
          },
          unreadCount: 0,
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isArchived: false,
          isPinned: false
        }
      ];

      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
        fetchMessages(mockConversations[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock messages - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: 'm1',
          content: 'Hey! I saw your latest project on GitHub. Really impressive work with the React hooks!',
          senderId: '2',
          sender: {
            id: '2',
            name: 'Sarah Chen',
            email: 'sarah@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            isOnline: true
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'text',
          isRead: true
        },
        {
          id: 'm2',
          content: 'Thanks! I\'ve been working on optimizing the performance. Did you check out the new custom hooks I created?',
          senderId: '1',
          sender: user!,
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          type: 'text',
          isRead: true
        },
        {
          id: 'm3',
          content: 'Yes! The useDebounce and useLocalStorage hooks are brilliant. Mind if I use them in our team project?',
          senderId: '2',
          sender: {
            id: '2',
            name: 'Sarah Chen',
            email: 'sarah@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            isOnline: true
          },
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          type: 'text',
          isRead: true
        },
        {
          id: 'm4',
          content: 'Of course! Feel free to use them. I\'m thinking of publishing them as an npm package soon.',
          senderId: '1',
          sender: user!,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          type: 'text',
          isRead: true
        },
        {
          id: 'm5',
          content: 'Hey, how\'s the React project coming along?',
          senderId: '2',
          sender: {
            id: '2',
            name: 'Sarah Chen',
            email: 'sarah@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            isOnline: true
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'text',
          isRead: false
        }
      ];

      setMessages(mockMessages);
      
      // Mark messages as read
      markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    // Update local state to mark unread messages as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user.id,
      sender: user,
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    };

    // Add to messages
    setMessages(prev => [...prev, optimisticMessage]);

    // Update conversation
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id
          ? { 
              ...conv, 
              lastMessage: optimisticMessage,
              updatedAt: new Date().toISOString()
            }
          : conv
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );

    try {
      // Replace with actual API call
      // await apiClient.post(`/messages/${selectedConversation.id}`, {
      //   content: messageContent,
      //   type: 'text'
      // });
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return null; // We'll show a group icon
    }
    const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
    return otherParticipant?.avatar;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeTab) {
      case 'unread':
        return matchesSearch && conv.unreadCount > 0;
      case 'archived':
        return matchesSearch && conv.isArchived;
      default:
        return matchesSearch && !conv.isArchived;
    }
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNav user={user} />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Messages
                  </h2>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {[
                    { key: 'all', label: 'All', count: conversations.filter(c => !c.isArchived).length },
                    { key: 'unread', label: 'Unread', count: conversations.filter(c => c.unreadCount > 0).length },
                    { key: 'archived', label: 'Archived', count: conversations.filter(c => c.isArchived).length }
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      variant={activeTab === tab.key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab(tab.key as any)}
                      className="flex-1 text-xs"
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                          {tab.count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-1 p-4 pt-0">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))
                    ) : filteredConversations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No conversations found</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => {
                        const isSelected = selectedConversation?.id === conversation.id;
                        const conversationName = getConversationName(conversation);
                        const avatar = getConversationAvatar(conversation);
                        
                        return (
                          <div
                            key={conversation.id}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              fetchMessages(conversation.id);
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800",
                              isSelected && "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
                            )}
                          >
                            <div className="relative">
                              {conversation.type === 'group' ? (
                                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-white" />
                                </div>
                              ) : (
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {conversationName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              {conversation.type === 'direct' && conversation.participants[0]?.isOnline && (
                                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={cn(
                                  "font-medium truncate",
                                  conversation.unreadCount > 0 && "font-semibold"
                                )}>
                                  {conversationName}
                                  {conversation.isPinned && (
                                    <Star className="inline h-3 w-3 ml-1 text-yellow-500 fill-current" />
                                  )}
                                </p>
                                <div className="flex items-center gap-1">
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-5 px-2 text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })}
                                  </span>
                                </div>
                              </div>
                              
                              {conversation.lastMessage && (
                                <p className={cn(
                                  "text-sm text-gray-500 truncate mt-1",
                                  conversation.unreadCount > 0 && "font-medium text-gray-700 dark:text-gray-300"
                                )}>
                                  {conversation.lastMessage.senderId === user.id && "You: "}
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            {selectedConversation ? (
              <Card className="h-full border-0 shadow-lg flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="lg:hidden">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="relative">
                        {selectedConversation.type === 'group' ? (
                          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getConversationAvatar(selectedConversation)} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getConversationName(selectedConversation).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        {selectedConversation.type === 'direct' && selectedConversation.participants[0]?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">{getConversationName(selectedConversation)}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.type === 'group' 
                            ? `${selectedConversation.participants.length} members`
                            : selectedConversation.participants[0]?.isOnline 
                              ? 'Online' 
                              : `Last seen ${formatDistanceToNow(new Date(selectedConversation.participants[0]?.lastSeen || ''), { addSuffix: true })}`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {messages.map((message, index) => {
                        const isOwn = message.senderId === user.id;
                        const showAvatar = !isOwn && (
                          index === 0 || 
                          messages[index - 1]?.senderId !== message.senderId ||
                          new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp).getTime() > 300000 // 5 minutes
                        );

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isOwn && (
                              <div className="w-8">
                                {showAvatar && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={message.sender.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                      {message.sender.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}

                            <div className={cn(
                              "max-w-[70%] space-y-1",
                              isOwn && "items-end"
                            )}>
                              {!isOwn && showAvatar && (
                                <p className="text-xs text-gray-500 px-3">
                                  {message.sender.name}
                                </p>
                              )}
                              
                              <div className={cn(
                                "px-4 py-3 rounded-2xl",
                                isOwn 
                                  ? "bg-blue-600 text-white rounded-br-md" 
                                  : "bg-gray-100 dark:bg-gray-800 rounded-bl-md"
                              )}>
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                              
                              <p className={cn(
                                "text-xs text-gray-500 px-3",
                                isOwn && "text-right"
                              )}>
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                {isOwn && (
                                  <span className="ml-2">
                                    {message.isRead ? (
                                      <span className="text-blue-500">✓✓</span>
                                    ) : (
                                      <span>✓</span>
                                    )}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Image className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-12"
                      />
                    </div>
                    
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full border-0 shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to Messages</h3>
                  <p className="text-gray-500">
                    Select a conversation to start messaging with your team
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
