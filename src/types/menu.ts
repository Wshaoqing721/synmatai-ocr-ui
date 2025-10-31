export interface MenuItem {
  name: string
  title: string
  path: string
  icon?: string
  children?: MenuItem[]
}
