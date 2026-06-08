import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...",
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const formattedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = formattedOptions.find(opt => String(opt.value) === String(value));

  // Update position
  const updatePosition = useCallback(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = Math.min(formattedOptions.length * 40 + 20, 250); // Estimated height
      
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = rect.bottom + window.scrollY + 6;
      let placement = 'bottom';
      
      // If there is not enough space below and there is more space above, render above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top + window.scrollY - dropdownHeight - 6;
        placement = 'top';
      }

      setDropdownStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        zIndex: 99999
      });
    }
  }, [isOpen, formattedOptions.length]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      // Use capture phase for scroll to catch inner scrolls
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = formattedOptions.findIndex(o => String(o.value) === String(value));
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
        return;
      }
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < formattedOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < formattedOptions.length) {
          onChange(formattedOptions[focusedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const renderDropdown = () => {
    if (!isOpen) return null;
    return createPortal(
      <div 
        ref={dropdownRef}
        style={dropdownStyle}
        className="bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1.5 flex flex-col max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] origin-top transition-all"
      >
        {formattedOptions.length === 0 ? (
          <div className="px-3 py-2 text-xs text-white/50 text-center font-medium">No options</div>
        ) : (
          formattedOptions.map((opt, index) => {
            const isSelected = String(opt.value) === String(value);
            const isFocused = index === focusedIndex;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`px-3 py-2.5 mx-1.5 my-0.5 rounded-lg text-sm font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected 
                    ? 'bg-primary/15 text-primary border border-primary/20' 
                    : isFocused 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={16} className="text-primary" />}
              </div>
            );
          })
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={triggerRef}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`relative flex items-center justify-between w-full bg-surface-container-lowest border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/50'} rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-low hover:border-outline-variant'} ${className}`}
      >
        <span className="truncate pr-4">{selectedOption ? selectedOption.label : <span className="text-on-surface-variant/70 font-medium">{placeholder}</span>}</span>
        <ChevronDown size={16} className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>
      {renderDropdown()}
    </>
  );
}
