<script lang="ts">
import { Component, Emit } from 'vue-facing-decorator';
import WorkMaintenanceMessage from '@/pages/customerManager/workMaintenance/WorkMaintenanceMessage.vue';
import WorkMaintenanceDealRecord from '@/pages/customerManager/workMaintenance/WorkMaintenanceDealRecord.vue';
import BaseDialog from '@/pages/basePage/BaseDialog';
import { useUserStore } from '@/store/user';
import { UserRole } from '@/enums/UserRole';

@Component({
  components: { WorkMaintenanceMessage, WorkMaintenanceDealRecord }
})
export default class WorkMaintenanceDetailTab extends BaseDialog {
  activeName = '工单信息';

  firstLoadTab2 = false;

  userStore = useUserStore();

  @Emit
  dealWorkOrder() {
    return '';
  }

  closeWorkOrderDrawer() {
    this.activeName = '工单信息';
    this.firstLoadTab2 = false;
    this.closeDialog();
  }

  tabDidChanged(name: string) {
    if (name == '处理记录' && !this.firstLoadTab2) {
      this.firstLoadTab2 = true;
      (this.$refs.workOrderDealRecord as InstanceType<typeof WorkMaintenanceDealRecord>)?.sendGetWorkOrderRecordRequest();
    }
  }

  dealWorkOrderAction() {
    this.closeWorkOrderDrawer();
    this.dealWorkOrder();
  }

  isShowDealButton(currentNodeManager: string) {
    const isWorkProcessRole = this.userStore.isRoot || this.userStore.roleKey == UserRole.JITUAN_ROOT_ROLE || this.userStore.roleKey == UserRole.YUNWEI_ROLE;
    if (isWorkProcessRole && currentNodeManager) {
      return true;
    }
    const userIdList = currentNodeManager?.split(',') || [];
    if (userIdList.includes(this.userStore.userId)) {
      return true;
    }
    return false;
  }
}
</script>

<template>
  <bep-drawer :model-value="isShowDialog" size="60%" destroy-on-close title="工单详情" @closed="closeWorkOrderDrawer">
    <div style="position: relative">
      <bep-tabs type="card" v-model="activeName" @tab-change="tabDidChanged">
        <bep-tab-pane label="工单信息" name="工单信息">
          <WorkMaintenanceMessage :currentRow="selectRow" />
        </bep-tab-pane>
        <bep-tab-pane label="处理记录" name="处理记录">
          <WorkMaintenanceDealRecord ref="workOrderDealRecord" :workOrderId="selectRow.workOrderId" />
        </bep-tab-pane>
      </bep-tabs>
      <bep-button v-if="isShowDealButton(selectRow.currentNodeManager)" class="deal-button-class" type="primary" @click="dealWorkOrderAction">处理工单 </bep-button>
    </div>
  </bep-drawer>
</template>
<style scoped lang="less">
.deal-button-class {
  position: absolute;
  top: 10px;
  right: 20px;
  z-index: 99;
}
</style>
