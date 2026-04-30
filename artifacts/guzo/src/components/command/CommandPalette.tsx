import { useEffect, useState, useMemo } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useLocation, useRoute } from 'wouter';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Map,
  ShoppingBag,
  Music,
  Newspaper,
  Church,
  User,
  Settings,
  Search,
  LogOut,
  MapPin,
  BookOpen,
  Trophy,
  Users,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface CommandItemType {
  id: string;
  title: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
}

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Close on escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const commands = useMemo<CommandItemType[]>(() => {
    const baseCommands: CommandItemType[] = [
      {
        id: 'home',
        title: 'Go to Home',
        shortcut: 'G H',
        icon: <Home className="w-4 h-4" />,
        action: () => {
          navigate('/');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
      },
      {
        id: 'destinations',
        title: 'Browse Destinations',
        shortcut: 'G D',
        icon: <MapPin className="w-4 h-4" />,
        action: () => {
          navigate('/destinations');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
        keywords: ['places', 'travel', 'holy sites'],
      },
      {
        id: 'churches',
        title: 'Find Churches',
        shortcut: 'G C',
        icon: <Church className="w-4 h-4" />,
        action: () => {
          navigate('/churches');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
        keywords: ['tewahedo', 'orthodox'],
      },
      {
        id: 'marketplace',
        title: 'Marketplace',
        shortcut: 'G M',
        icon: <ShoppingBag className="w-4 h-4" />,
        action: () => {
          navigate('/marketplace');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
        keywords: ['shop', 'buy', 'icons', 'crosses'],
      },
      {
        id: 'mezmurs',
        title: 'Mezmurs',
        shortcut: 'G Z',
        icon: <Music className="w-4 h-4" />,
        action: () => {
          navigate('/mezmurs');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
        keywords: ['songs', 'hymns', 'music'],
      },
      {
        id: 'news',
        title: 'News',
        shortcut: 'G N',
        icon: <Newspaper className="w-4 h-4" />,
        action: () => {
          navigate('/news');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
        keywords: ['articles', 'updates'],
      },
      {
        id: 'map',
        title: 'Open Map',
        shortcut: 'G A',
        icon: <Map className="w-4 h-4" />,
        action: () => {
          navigate('/map');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
      },
      {
        id: 'learn',
        title: 'Learn & Quizzes',
        shortcut: 'G L',
        icon: <BookOpen className="w-4 h-4" />,
        action: () => {
          navigate('/learn');
          setCommandPaletteOpen(false);
        },
        category: 'Navigation',
        keywords: ['education', 'questions', 'study'],
      },
      {
        id: 'profile',
        title: 'My Profile',
        shortcut: 'G P',
        icon: <User className="w-4 h-4" />,
        action: () => {
          navigate('/me');
          setCommandPaletteOpen(false);
        },
        category: 'User',
      },
      {
        id: 'leaderboard',
        title: 'Leaderboard',
        shortcut: 'G B',
        icon: <Trophy className="w-4 h-4" />,
        action: () => {
          navigate('/learn/leaderboard');
          setCommandPaletteOpen(false);
        },
        category: 'User',
        keywords: ['ranking', 'points', 'score'],
      },
      {
        id: 'settings',
        title: 'Settings',
        shortcut: 'G S',
        icon: <Settings className="w-4 h-4" />,
        action: () => {
          // Open settings sheet
          setCommandPaletteOpen(false);
        },
        category: 'User',
      },
      {
        id: 'help',
        title: 'Help & Support',
        icon: <HelpCircle className="w-4 h-4" />,
        action: () => {
          // Show help modal
          setCommandPaletteOpen(false);
        },
        category: 'User',
      },
    ];

    const adminCommands: CommandItemType[] = user?.role === 'admin' || user?.role === 'superadmin'
      ? [
          {
            id: 'admin',
            title: 'Admin Dashboard',
            shortcut: 'G Shift+A',
            icon: <Shield className="w-4 h-4" />,
            action: () => {
              navigate('/admin');
              setCommandPaletteOpen(false);
            },
            category: 'Admin',
          },
          {
            id: 'admin-users',
            title: 'Manage Users',
            icon: <Users className="w-4 h-4" />,
            action: () => {
              navigate('/admin/users');
              setCommandPaletteOpen(false);
            },
            category: 'Admin',
          },
          {
            id: 'admin-analytics',
            title: 'Analytics',
            icon: <Search className="w-4 h-4" />,
            action: () => {
              navigate('/admin/analytics');
              setCommandPaletteOpen(false);
            },
            category: 'Admin',
          },
        ]
      : [];

    const authCommands: CommandItemType[] = user
      ? [
          {
            id: 'logout',
            title: 'Log Out',
            icon: <LogOut className="w-4 h-4" />,
            action: () => {
              logout();
              setCommandPaletteOpen(false);
            },
            category: 'Auth',
          },
        ]
      : [];

    return [...baseCommands, ...adminCommands, ...authCommands];
  }, [navigate, setCommandPaletteOpen, user, logout]);

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands;
    
    const query = searchQuery.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  }, [commands, searchQuery]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItemType[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([category, items], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={item.action}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  {item.shortcut && (
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs bg-muted rounded">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
