type WorkItemImageType = 'FULL_VIEW' | 'TRUNK/BASE' | 'CROWN/CANOPY' | 'STUMP' | 'WORK_AREA';

interface IWorkItemImage {
    id?: number | undefined;
    url: string;
    type: WorkItemImageType;
    config: string | null;
    workItemId?: number | undefined;
}

type TreeSpecie =
    | 'NOT_SURE'
    | 'OAK'
    | 'PINE'
    | 'REDWOOD'
    | 'EUCALYPTUS'
    | 'PALM'
    | 'MAPLE'
    | 'ELM'
    | 'SYCAMORE'
    | 'COTTONWOOD'
    | 'WILLOW'
    | 'OLIVE'
    | 'PEPPER_TREE'
    | 'FRUIT_TREE'
    | 'ORNAMENTAL_TREE'
    | 'SHRUB/BUSH';

type WorkItemScope =
    | 'PRUNE_CLASS_1'
    | 'PRUNE_CLASS_2'
    | 'PRUNE_CLASS_3'
    | 'RAISE_CANOPY'
    | 'STANDARD_CLEARANCE'
    | 'NO_OVER_HANG'
    | 'CROWN_REDUCTION'
    | 'ARBORIST_RECOMMENDATION'
    | 'PALM_TREE_PRUNING'
    | 'FRUIT_TREE_PRUNING'
    | 'TREE_REMOVAL'
    | 'STUMP_GRINDING_OPTION_A'
    | 'STUMP_GRINDING_OPTION_B'
    | 'STUMP_GRINDING_OPTION_C'
    | 'CUSTOM_SERVICE'
    | 'SELECTIVE_THINNING'
    | 'REMOVE_DEAD_WOOD'
    | 'WEIGHT_REDUCTION'
    | 'TREE_SPRAYING';

type WorkItemLocation = 'FRONT_YARD' | 'BACK_YARD' | 'SIDE_YARD' | 'NEAR_HOUSE' | 'UNKNOWN';

interface IWorkItem {
    id?: number | undefined;
    treeSpecie: TreeSpecie;
    quantity: number;
    scopes: WorkItemScope[];
    raiseCanopyFeet: number | null;
    crownReductionPercentage: number | null;
    customServiceNote: string | null;
    desiredTimeFrame: string | null;
    noCleanUp: boolean | 0 | 1 | null;
    woodHandling: 'LEAVE' | 'HAUL' | 'CUT' | null;
    woodLengthToBeCut: number | null;
    debrisHandling: 'LEAVE' | 'HAUL' | null;
    accessOption: WorkItemLocation;
    accessOptionNote: string | null;

    laborCost: number | null;
    estimatedHours: number | null;
    note: string | null;
}
