import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardId } from '../types/dashboard';
import './DashboardCard.css';

interface DashboardCardProps {
  id: CardId;
  title: string;
  isEditMode: boolean;
  children: React.ReactNode;
}

export default function DashboardCard({
  id,
  title,
  isEditMode,
  children,
}: DashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
  };

  // Build class list — stop jiggle on the item being dragged so
  // dnd-kit's transform isn't fighting the CSS animation
  const classes = [
    'dashboard-card',
    isEditMode && !isDragging ? 'dashboard-card--edit' : '',
    isDragging ? 'dashboard-card--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classes}
      onContextMenu={isEditMode ? (e) => e.preventDefault() : undefined}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      aria-label={isEditMode ? `Drag to reorder ${title}` : undefined}
    >
      {children}
    </div>
  );
}
