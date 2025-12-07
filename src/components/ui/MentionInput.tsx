/**
 * MentionInput Component
 * 
 * Textarea with @mention autocomplete for org members.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

interface MentionSuggestion {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const MentionInput = ({
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
  disabled,
}: MentionInputProps) => {
  const { members } = useOrganization();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Convert members to suggestions format
  const allSuggestions: MentionSuggestion[] = members.map(m => ({
    id: m.userId,
    name: m.fullName || m.email?.split('@')[0] || 'Unknown',
    email: m.email || '',
    avatar: m.avatarUrl,
  }));

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Check for @ symbol
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show suggestions if @ is start of word (preceded by space or start)
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && 
          !textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStart(lastAtIndex);
        const query = textAfterAt.toLowerCase();
        const filtered = allSuggestions.filter(s => 
          s.name.toLowerCase().includes(query) || 
          s.email.toLowerCase().includes(query)
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionStart(null);
  };

  const insertMention = useCallback((suggestion: MentionSuggestion) => {
    if (mentionStart === null || !textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(cursorPos);
    
    // Use name without spaces for the mention
    const mentionText = `@${suggestion.name.replace(/\s+/g, '')} `;
    const newValue = beforeMention + mentionText + afterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);

    // Set cursor position after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = beforeMention.length + mentionText.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [mentionStart, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
        disabled={disabled}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-64 rounded-md border bg-popover shadow-md"
        >
          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => insertMention(suggestion)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors",
                  index === selectedIndex && "bg-muted"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={suggestion.avatar} />
                  <AvatarFallback className="text-xs">
                    {suggestion.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{suggestion.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{suggestion.email}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Tab</kbd> or <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Enter</kbd> to select
            </p>
          </div>
        </div>
      )}

      {members.length > 1 && (
        <p className="text-xs text-muted-foreground mt-1">
          Type @ to mention a team member
        </p>
      )}
    </div>
  );
};

// Export utility to extract mentions from text
export function extractMentions(text: string, members: { userId: string; fullName?: string; email?: string }[]): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex) || [];
  const mentionedUserIds: string[] = [];

  matches.forEach(match => {
    const name = match.slice(1).toLowerCase(); // Remove @
    const member = members.find(m => 
      m.fullName?.replace(/\s+/g, '').toLowerCase() === name ||
      m.email?.split('@')[0].toLowerCase() === name
    );
    if (member && !mentionedUserIds.includes(member.userId)) {
      mentionedUserIds.push(member.userId);
    }
  });

  return mentionedUserIds;
}

