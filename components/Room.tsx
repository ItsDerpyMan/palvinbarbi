export interface RoomProps {
  id: number;
  name?: string;
  hasStarted: boolean;
  numberOfPlayers: number;
  created: number;
  onClick: () => void;
}

export function Room(props: RoomProps) {
  return (
    <div
      {...props}
      class="px-2 py-1 border-gray-500 border-2 rounded-sm bg-white hover:bg-gray-200 transition-colors"
    />
  );
}
