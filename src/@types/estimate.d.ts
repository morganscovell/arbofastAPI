type EstimateStatus = 'PENDING' | 'ACCEPTED' | 'SENT_TO_QUICKBOOK' | 'DRAFT' | 'APPROVED';

type Hazards =
    | 'POWER_LINES'
    | 'STRUCTURE_NEARBY'
    | 'ROAD/TRAFFIC'
    | 'STEEP_SLOPE'
    | 'LIMITED ACCESS'
    | 'SEPTIC/UNDERGROUND_UTILITIES'
    | 'DEAD/HAZARDOUS_TREE_CONDITION'
    | 'LEAN/OVER_TARGET'
    | 'TIGHT_DROPZONE';

type EquipmentOrCrewOptions =
    | 'CLIMB_CREW'
    | 'BUCKET_TRUCK_AERIAL_LIFT'
    | 'CRANE'
    | 'RIGGING_ONLY_NO_LIFT_NEEDED'
    | 'CHIPPER'
    | 'CHIPPER_TRUCK'
    | 'DUMP_TRAILER'
    | 'HAUL_OFF_REMOVE_MATERIAL'
    | 'SMALL_STUMP_GRINDER'
    | 'LARGE_STUMP_GRINDER'
    | 'LOADER_SKID_STEER'
    | 'TRACTOR'
    | 'TIGHT_ACCESS_NO_EQUIPMENT_ACCESS'
    | 'BACKYARD_ONLY'
    | 'STEEP_TERRAIN'
    | 'PERMIT_REQUIRED'
    | 'TRAFFIC_CONTROL'
    | 'LANE_CLOSURE'
    | 'SIGNS'
    | 'STANDARD_CREW'
    | 'EXTRA_CREW'
    | 'CRANE_CREW'
    | 'PLYWOOD'
    | 'DOLLY'
    | 'WHEELBARROW'
    | 'BIG_BAR'
    | 'HAND_CARRY_ONLY'
    | 'POWER_LINE_PROXIMITY';

interface IEstimate {
    id?: number | undefined;
    username: string;
    email: string;
    phone: string;
    address: string;
    longitude: number | null;
    latitude: number | null;
    status: EstimateStatus;
    noteOrInstruction: string | null;
    userId: number | null;
    equipmentOrCrewOptions: EquipmentOrCrewOptions[] | null;
    hazards: Hazards[] | null;
}
