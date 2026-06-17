import * as z from 'zod';

const TREE_SPECIE: TreeSpecie[] = [
    'NOT_SURE',
    'OAK',
    'PINE',
    'REDWOOD',
    'EUCALYPTUS',
    'PALM',
    'MAPLE',
    'ELM',
    'SYCAMORE',
    'COTTONWOOD',
    'WILLOW',
    'OLIVE',
    'PEPPER_TREE',
    'FRUIT_TREE',
    'ORNAMENTAL_TREE',
    'SHRUB/BUSH'
];

const WORK_ITEM_SCOPES: WorkItemScope[] = [
    'PRUNE_CLASS_1',
    'PRUNE_CLASS_2',
    'PRUNE_CLASS_3',
    'RAISE_CANOPY',
    'STANDARD_CLEARANCE',
    'NO_OVER_HANG',
    'CROWN_REDUCTION',
    'ARBORIST_RECOMMENDATION',
    'PALM_TREE_PRUNING',
    'FRUIT_TREE_PRUNING',
    'TREE_REMOVAL',
    'STUMP_GRINDING_OPTION_A',
    'STUMP_GRINDING_OPTION_B',
    'STUMP_GRINDING_OPTION_C',
    'CUSTOM_SERVICE',
    'SELECTIVE_THINNING',
    'REMOVE_DEAD_WOOD',
    'WEIGHT_REDUCTION',
    'TREE_SPRAYING'
];

const zBool = z.preprocess((val) => {
    if (val == 1 || val == '1' || val == true) return true;
    if (val == 0 || val == '0' || val == false) return false;
    return false;
}, z.boolean());

const nullableNumber = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }, schema.nullable());

const workItem = z.object({
    id: z.coerce.number().int().positive().optional(),
    treeSpecie: z.enum(TREE_SPECIE),
    quantity: z.coerce.number().min(1).default(1),
    scopes: z.array(z.enum(WORK_ITEM_SCOPES)),
    raiseCanopyFeet: nullableNumber(z.coerce.number().min(1).max(100)).default(null),
    crownReductionPercentage: nullableNumber(z.coerce.number().min(1).max(100)).default(null),
    customServiceNote: z.string().trim().nullable().default(null),
    desiredTimeFrame: z.string().trim().nullable().default(null),
    noCleanUp: zBool.nullable().default(null),
    woodHandling: z.enum(['LEAVE', 'HAUL', 'CUT']).nullable().default(null),
    woodLengthToBeCut: nullableNumber(z.coerce.number().min(1).max(2000)).default(null),
    debrisHandling: z.enum(['LEAVE', 'HAUL']).nullable().default(null),
    accessOption: z.enum(['FRONT_YARD', 'BACK_YARD', 'SIDE_YARD', 'NEAR_HOUSE', 'UNKNOWN']),
    accessOptionNote: z.string().trim().nullable().default(null),
    laborCost: nullableNumber(z.coerce.number().min(1)).default(null),
    estimatedHours: nullableNumber(z.coerce.number().min(1).max(100)).default(null),
    note: z.string().trim().nullable().default(null)
});

const workItemImageSchema = z.object({
    id: z.coerce.number().int().positive().optional(),
    url: z.string(),
    type: z.enum(['FULL_VIEW', 'TRUNK/BASE', 'CROWN/CANOPY', 'STUMP', 'WORK_AREA']),
    config: z.any().nullable().default(null),
    workItemId: z.coerce.number().int().positive().optional()
});

export const workItemSchema = workItem
    .extend({
        images: z.array(workItemImageSchema).default([])
    })
    .superRefine((data, ctx) => {
        if (data.scopes.includes('RAISE_CANOPY') && !data.raiseCanopyFeet) {
            ctx.addIssue({
                code: 'custom',
                path: ['raiseCanopyFeet'],
                message: 'raiseCanopyFeet is required when RAISE_CANOPY scope is selected'
            });
        }

        if (data.scopes.includes('CROWN_REDUCTION') && !data.crownReductionPercentage) {
            ctx.addIssue({
                code: 'custom',
                path: ['crownReductionPercentage'],
                message: 'crownReductionPercentage is required when CROWN_REDUCTION scope is selected'
            });
        }

        if (data.scopes.includes('CUSTOM_SERVICE') && !data.customServiceNote) {
            ctx.addIssue({
                code: 'custom',
                path: ['customServiceNote'],
                message: 'customServiceNote is required when CUSTOM_SERVICE scope is selected'
            });
        }
    })
    .transform((data) => ({
        ...data,

        raiseCanopyFeet: data.scopes.includes('RAISE_CANOPY') ? data.raiseCanopyFeet : null,
        crownReductionPercentage: data.scopes.includes('CROWN_REDUCTION') ? data.crownReductionPercentage : null,
        customServiceNote: data.scopes.includes('CUSTOM_SERVICE') ? data.customServiceNote : null,

        woodHandling: data.noCleanUp ? null : data.woodHandling,
        woodLengthToBeCut: data.noCleanUp ? null : data.woodLengthToBeCut,
        debrisHandling: data.noCleanUp ? null : data.debrisHandling
    }));

export type WorkItemDto = z.infer<typeof workItemSchema>;
