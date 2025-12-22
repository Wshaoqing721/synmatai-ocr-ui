// Mock API Service
export interface Field {
  field_id: string
  field_name: string
  field_type: string
  is_key?: boolean
  is_required?: boolean
  validation_rule?: Record<string, any>
  order?: number
}

export interface Ontology {
  id: number
  name: string
  fields: Field[]
  created_at?: string
}

export interface Action {
  id: number
  name: string
  description: string
  api_url: string
  method: string
  input_schema: Record<string, any>
  output_schema?: Record<string, any>
}

export interface DataSource {
  id: number
  name: string
  url: string
  auth_type: string
  auth_config?: Record<string, any>
  schedule?: string
}

export interface Mapping {
  id: number
  datasource: number
  ontology: number
  field_mapping: Record<string, string>
  created_at?: string
}

export interface OntologyRelation {
  id: number
  from_ontology: number
  to_ontology: number
  relation_type: string
  description?: string
}

// Mock data
let ontologies: Ontology[] = [
  {
    id: 1,
    name: "药物分子",
    fields: [
      { field_id: "id", field_name: "ID", field_type: "string", is_key: true, order: 0 },
      {
        field_id: "smiles",
        field_name: "SMILES结构",
        field_type: "string",
        is_required: true,
        validation_rule: { regex: "^C.*" },
        order: 1,
      },
      { field_id: "purity", field_name: "纯度", field_type: "float", validation_rule: { min: 0, max: 100 }, order: 2 },
    ],
    created_at: "2024-01-15",
  },
]

let actions: Action[] = [
  {
    id: 1,
    name: "AI溶解度预测",
    description: "使用AI模型预测药物分子的溶解度",
    api_url: "https://api.example.com/predict/solubility",
    method: "POST",
    input_schema: { smiles: "string", predict_type: "string" },
    output_schema: { solubility: "float", confidence: "float" },
  },
]

let dataSources: DataSource[] = [
  {
    id: 1,
    name: "外部药物数据库",
    url: "https://api.drugbank.com/molecules",
    auth_type: "Bearer",
    auth_config: { token: "your-api-key" },
    schedule: "0 0 * * *",
  },
]

const mappings: Mapping[] = []
let ontologyRelations: OntologyRelation[] = []

// API functions
export const api = {
  // Ontology APIs
  getOntologies: async (): Promise<Ontology[]> => {
    await delay(300)
    return [...ontologies]
  },

  getOntology: async (id: number): Promise<Ontology> => {
    await delay(300)
    const ontology = ontologies.find((o) => o.id === id)
    if (!ontology) throw new Error("Ontology not found")
    return { ...ontology }
  },

  createOntology: async (data: Omit<Ontology, "id">): Promise<Ontology> => {
    await delay(300)
    const newOntology = {
      ...data,
      id: Math.max(0, ...ontologies.map((o) => o.id)) + 1,
      created_at: new Date().toISOString().split("T")[0],
    }
    ontologies.push(newOntology)
    return newOntology
  },

  updateOntology: async (id: number, data: Partial<Ontology>): Promise<Ontology> => {
    await delay(300)
    const index = ontologies.findIndex((o) => o.id === id)
    if (index === -1) throw new Error("Ontology not found")
    ontologies[index] = { ...ontologies[index], ...data }
    return ontologies[index]
  },

  deleteOntology: async (id: number): Promise<void> => {
    await delay(300)
    ontologies = ontologies.filter((o) => o.id !== id)
  },

  bindAction: async (ontologyId: number, actionId: number, fieldMapping: Record<string, string>): Promise<void> => {
    await delay(300)
    console.log("Binding action", actionId, "to ontology", ontologyId, "with mapping", fieldMapping)
  },

  // Action APIs
  getActions: async (): Promise<Action[]> => {
    await delay(300)
    return [...actions]
  },

  getAction: async (id: number): Promise<Action> => {
    await delay(300)
    const action = actions.find((a) => a.id === id)
    if (!action) throw new Error("Action not found")
    return { ...action }
  },

  createAction: async (data: Omit<Action, "id">): Promise<Action> => {
    await delay(300)
    const newAction = {
      ...data,
      id: Math.max(0, ...actions.map((a) => a.id)) + 1,
    }
    actions.push(newAction)
    return newAction
  },

  updateAction: async (id: number, data: Partial<Action>): Promise<Action> => {
    await delay(300)
    const index = actions.findIndex((a) => a.id === id)
    if (index === -1) throw new Error("Action not found")
    actions[index] = { ...actions[index], ...data }
    return actions[index]
  },

  deleteAction: async (id: number): Promise<void> => {
    await delay(300)
    actions = actions.filter((a) => a.id !== id)
  },

  testAction: async (id: number, params: Record<string, any>): Promise<any> => {
    await delay(1000)
    return {
      success: true,
      result: { solubility: 0.85, confidence: 0.92 },
      message: "Test completed successfully",
    }
  },

  // DataSource APIs
  getDataSources: async (): Promise<DataSource[]> => {
    await delay(300)
    return [...dataSources]
  },

  getDataSource: async (id: number): Promise<DataSource> => {
    await delay(300)
    const ds = dataSources.find((d) => d.id === id)
    if (!ds) throw new Error("DataSource not found")
    return { ...ds }
  },

  createDataSource: async (data: Omit<DataSource, "id">): Promise<DataSource> => {
    await delay(300)
    const newDS = {
      ...data,
      id: Math.max(0, ...dataSources.map((d) => d.id)) + 1,
    }
    dataSources.push(newDS)
    return newDS
  },

  updateDataSource: async (id: number, data: Partial<DataSource>): Promise<DataSource> => {
    await delay(300)
    const index = dataSources.findIndex((d) => d.id === id)
    if (index === -1) throw new Error("DataSource not found")
    dataSources[index] = { ...dataSources[index], ...data }
    return dataSources[index]
  },

  deleteDataSource: async (id: number): Promise<void> => {
    await delay(300)
    dataSources = dataSources.filter((d) => d.id !== id)
  },

  testDataSource: async (id: number): Promise<any> => {
    await delay(1000)
    return {
      success: true,
      message: "Connection successful",
    }
  },

  previewData: async (id: number): Promise<any> => {
    await delay(1000)
    return {
      data: [
        { external_id: "MOL001", smiles_code: "CCO", purity: 99.5 },
        { external_id: "MOL002", smiles_code: "CC(C)O", purity: 98.2 },
      ],
    }
  },

  // Mapping APIs
  getMappings: async (): Promise<Mapping[]> => {
    await delay(300)
    return [...mappings]
  },

  createMapping: async (data: Omit<Mapping, "id">): Promise<Mapping> => {
    await delay(300)
    const newMapping = {
      ...data,
      id: Math.max(0, ...mappings.map((m) => m.id)) + 1,
      created_at: new Date().toISOString().split("T")[0],
    }
    mappings.push(newMapping)
    return newMapping
  },

  triggerSync: async (id: number): Promise<void> => {
    await delay(2000)
    console.log("Sync triggered for mapping", id)
  },

  // Ontology Relation APIs
  getOntologyRelations: async (): Promise<OntologyRelation[]> => {
    await delay(300)
    return [...ontologyRelations]
  },

  createOntologyRelation: async (data: Omit<OntologyRelation, "id">): Promise<OntologyRelation> => {
    await delay(300)
    const newRelation = {
      ...data,
      id: Math.max(0, ...ontologyRelations.map((r) => r.id)) + 1,
    }
    ontologyRelations.push(newRelation)
    return newRelation
  },

  deleteOntologyRelation: async (id: number): Promise<void> => {
    await delay(300)
    ontologyRelations = ontologyRelations.filter((r) => r.id !== id)
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
