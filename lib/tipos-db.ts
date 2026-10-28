export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      anadas: {
        Row: {
          actualizado_en: string
          anio: number | null
          codigo_tango: string
          creado_en: string
          descripcion_tango: string
          en_stock: boolean
          id: string
          precio: number | null
          producto_id: string
          tipo: Database["public"]["Enums"]["tipo_anada"]
        }
        Insert: {
          actualizado_en?: string
          anio?: number | null
          codigo_tango: string
          creado_en?: string
          descripcion_tango: string
          en_stock?: boolean
          id?: string
          precio?: number | null
          producto_id: string
          tipo: Database["public"]["Enums"]["tipo_anada"]
        }
        Update: {
          actualizado_en?: string
          anio?: number | null
          codigo_tango?: string
          creado_en?: string
          descripcion_tango?: string
          en_stock?: boolean
          id?: string
          precio?: number | null
          producto_id?: string
          tipo?: Database["public"]["Enums"]["tipo_anada"]
        }
        Relationships: [
          {
            foreignKeyName: "anadas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "carta_publica"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "anadas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anadas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      bodegas: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          nombre: string
          nombre_orden: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre: string
          nombre_orden?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre?: string
          nombre_orden?: string | null
        }
        Relationships: []
      }
      codigos_barras: {
        Row: {
          codigo: string
          creado_en: string
          producto_id: string
        }
        Insert: {
          codigo: string
          creado_en?: string
          producto_id: string
        }
        Update: {
          codigo?: string
          creado_en?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codigos_barras_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "carta_publica"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "codigos_barras_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codigos_barras_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      personal: {
        Row: {
          creado_en: string
          rol: string
          user_id: string
        }
        Insert: {
          creado_en?: string
          rol: string
          user_id: string
        }
        Update: {
          creado_en?: string
          rol?: string
          user_id?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          actualizado_en: string
          bodega_id: string | null
          creado_en: string
          descripcion: string | null
          foto_path: string | null
          id: string
          nombre: string
          orden: number | null
          seccion_id: string | null
          tipo: Database["public"]["Enums"]["tipo_producto"]
          varietal: string | null
          visible: boolean
        }
        Insert: {
          actualizado_en?: string
          bodega_id?: string | null
          creado_en?: string
          descripcion?: string | null
          foto_path?: string | null
          id?: string
          nombre: string
          orden?: number | null
          seccion_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_producto"]
          varietal?: string | null
          visible?: boolean
        }
        Update: {
          actualizado_en?: string
          bodega_id?: string | null
          creado_en?: string
          descripcion?: string | null
          foto_path?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          seccion_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_producto"]
          varietal?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "productos_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "carta_publica"
            referencedColumns: ["seccion_id"]
          },
          {
            foreignKeyName: "productos_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "carta_secciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "secciones"
            referencedColumns: ["id"]
          },
        ]
      }
      secciones: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          nombre: string
          orden: number
          seccion_padre_id: string | null
          visible: boolean
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre: string
          orden: number
          seccion_padre_id?: string | null
          visible?: boolean
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre?: string
          orden?: number
          seccion_padre_id?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "secciones_seccion_padre_id_fkey"
            columns: ["seccion_padre_id"]
            isOneToOne: false
            referencedRelation: "carta_publica"
            referencedColumns: ["seccion_id"]
          },
          {
            foreignKeyName: "secciones_seccion_padre_id_fkey"
            columns: ["seccion_padre_id"]
            isOneToOne: false
            referencedRelation: "carta_secciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secciones_seccion_padre_id_fkey"
            columns: ["seccion_padre_id"]
            isOneToOne: false
            referencedRelation: "secciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      carta_publica: {
        Row: {
          anada_id: string | null
          anada_tipo: Database["public"]["Enums"]["tipo_anada"] | null
          anio: number | null
          bodega_nombre: string | null
          bodega_orden: string | null
          descripcion: string | null
          foto_path: string | null
          precio: number | null
          producto_id: string | null
          producto_nombre: string | null
          producto_orden: number | null
          producto_precio_min: number | null
          producto_tipo: Database["public"]["Enums"]["tipo_producto"] | null
          seccion_id: string | null
          seccion_nombre: string | null
          seccion_orden: number | null
          varietal: string | null
        }
        Relationships: []
      }
      carta_secciones: {
        Row: {
          id: string | null
          nombre: string | null
          orden: number | null
        }
        Relationships: []
      }
      productos_admin: {
        Row: {
          anadas_a_revisar: number | null
          anadas_en_stock: number | null
          bodega_nombre: string | null
          cantidad_anadas: number | null
          foto_path: string | null
          id: string | null
          nombre: string | null
          seccion_id: string | null
          seccion_nombre: string | null
          tipo: Database["public"]["Enums"]["tipo_producto"] | null
          varietal: string | null
          visible: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "carta_publica"
            referencedColumns: ["seccion_id"]
          },
          {
            foreignKeyName: "productos_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "carta_secciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "secciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      buscar_admin: {
        Args: { limite?: number; texto: string }
        Returns: {
          producto_id: string
          relevancia: number
        }[]
      }
      buscar_carta: {
        Args: { limite?: number; texto: string }
        Returns: {
          anada_id: string
          anada_tipo: Database["public"]["Enums"]["tipo_anada"]
          anio: number
          bodega_nombre: string
          descripcion: string
          foto_path: string
          precio: number
          producto_id: string
          producto_nombre: string
          producto_orden: number
          producto_tipo: Database["public"]["Enums"]["tipo_producto"]
          relevancia: number
          seccion_id: string
          seccion_nombre: string
          seccion_orden: number
          varietal: string
        }[]
      }
      buscar_por_codigo_barras: {
        Args: { codigo: string }
        Returns: {
          anada_id: string | null
          anada_tipo: Database["public"]["Enums"]["tipo_anada"] | null
          anio: number | null
          bodega_nombre: string | null
          bodega_orden: string | null
          descripcion: string | null
          foto_path: string | null
          precio: number | null
          producto_id: string | null
          producto_nombre: string | null
          producto_orden: number | null
          producto_precio_min: number | null
          producto_tipo: Database["public"]["Enums"]["tipo_producto"] | null
          seccion_id: string | null
          seccion_nombre: string | null
          seccion_orden: number | null
          varietal: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "carta_publica"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      es_encargado: { Args: never; Returns: boolean }
      es_personal: { Args: never; Returns: boolean }
      normalizar_busqueda: { Args: { texto: string }; Returns: string }
      ordenar_destacados: {
        Args: { ids: string[]; seccion: string }
        Returns: undefined
      }
      ordenar_secciones: { Args: { ids: string[] }; Returns: undefined }
    }
    Enums: {
      tipo_anada: "con_anio" | "sin_especificar" | "sin_anada"
      tipo_producto: "vino" | "destilado" | "aceite" | "almacen"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_anada: ["con_anio", "sin_especificar", "sin_anada"],
      tipo_producto: ["vino", "destilado", "aceite", "almacen"],
    },
  },
} as const
