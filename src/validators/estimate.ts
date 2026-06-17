import * as z from 'zod';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

const STATUS: EstimateStatus[] = ['PENDING', 'ACCEPTED', 'SENT_TO_QUICKBOOK', 'DRAFT', 'APPROVED'];

const HAZARDS: Hazards[] = [
    'POWER_LINES',
    'STRUCTURE_NEARBY',
    'ROAD/TRAFFIC',
    'STEEP_SLOPE',
    'LIMITED ACCESS',
    'SEPTIC/UNDERGROUND_UTILITIES',
    'DEAD/HAZARDOUS_TREE_CONDITION',
    'LEAN/OVER_TARGET',
    'TIGHT_DROPZONE'
];

const EQUIPMENT_OR_CREW_OPTIONS: EquipmentOrCrewOptions[] = [
    'CLIMB_CREW',
    'BUCKET_TRUCK_AERIAL_LIFT',
    'CRANE',
    'RIGGING_ONLY_NO_LIFT_NEEDED',
    'CHIPPER',
    'CHIPPER_TRUCK',
    'DUMP_TRAILER',
    'HAUL_OFF_REMOVE_MATERIAL',
    'SMALL_STUMP_GRINDER',
    'LARGE_STUMP_GRINDER',
    'LOADER_SKID_STEER',
    'TRACTOR',
    'TIGHT_ACCESS_NO_EQUIPMENT_ACCESS',
    'BACKYARD_ONLY',
    'STEEP_TERRAIN',
    'PERMIT_REQUIRED',
    'TRAFFIC_CONTROL',
    'LANE_CLOSURE',
    'SIGNS',
    'STANDARD_CREW',
    'EXTRA_CREW',
    'CRANE_CREW',
    'PLYWOOD',
    'DOLLY',
    'WHEELBARROW',
    'BIG_BAR',
    'HAND_CARRY_ONLY',
    'POWER_LINE_PROXIMITY'
];

const nullableNumber = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }, schema.nullable());

export const estimateSchema = z
    .object({
        id: z.coerce.number().int().positive().optional(),
        username: z.string().trim().min(3).max(30),
        email: z.email(),
        phone: z.string().trim(),
        address: z.string().min(3, { message: 'Invalid address' }).trim(),
        latitude: nullableNumber(z.coerce.number().min(-90).max(90)).default(null),
        longitude: nullableNumber(z.coerce.number().min(-180).max(180)).default(null),
        status: z.enum(STATUS).default('PENDING'),
        noteOrInstruction: z.string().nullable().default(null),
        userId: z.coerce.number().int().positive().optional().nullable().default(null),
        hazards: z.array(z.enum(HAZARDS)).nullable().default(null),
        equipmentOrCrewOptions: z.array(z.enum(EQUIPMENT_OR_CREW_OPTIONS)).nullable().default(null),
        workItems: z.array(z.number())
    })
    .refine(
        (data) => {
            if (data.phone) {
                const phone: PhoneNumber | undefined = parsePhoneNumber(data.phone);
                return phone?.isValid() ?? false;
            }
            return true;
        },
        { path: ['phone'], message: 'Invalid phone number' }
    );

export type CreateEstimateDto = z.infer<typeof estimateSchema>;
