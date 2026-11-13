import feedexLogo from '../assets/images/feedex_logo_1794540349940.jpg';
import heroCargoBanner from '../assets/images/hero_cargo_banner_1794540350104.jpg';
import heroGlobalNetwork from '../assets/images/hero_global_network_1794540348643.jpg';
import planVipExpress from '../assets/images/plan_vip_express_1794540351281.jpg';
import planVipFreight from '../assets/images/plan_vip_freight_1794540351957.jpg';
import planWelfareHub from '../assets/images/plan_welfare_hub_1794540352415.jpg';
import type { PlanImageKey } from '../types';

export const BRAND_ASSETS = {
  logo: feedexLogo,
  banners: [heroCargoBanner, heroGlobalNetwork],
  planImages: {
    vip_express: planVipExpress,
    vip_freight: planVipFreight,
    welfare_hub: planWelfareHub,
    hero_cargo: heroCargoBanner,
    hero_network: heroGlobalNetwork,
  } as Record<PlanImageKey, string>,
};
