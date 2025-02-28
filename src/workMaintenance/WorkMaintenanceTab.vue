<script lang="ts">
import { Component } from 'vue-facing-decorator';
import WorkMaintenance from '@/pages/customerManager/workMaintenance/WorkMaintenance.vue';
import { useWorkOrderStore } from '@/store/workOrderStore';
import BaseNewPage from '@/pages/basePage/BaseNewPage';
import { usePermissionsStore } from '@/store/permissions';

@Component({
  components: { WorkMaintenance }
})
export default class WorkMaintenanceTab extends BaseNewPage {
  activeName = '全部工单';

  searchSimId = '';

  workOrderStore = useWorkOrderStore();
  permissionsStore = usePermissionsStore();

  mounted() {
    this.workOrderStore.sendGetWorkStyleDataRequest();
    if (this.searchParams) {
      this.searchSimId = this.searchParams.get('simId');
      setTimeout(() => {
        (this.$refs.workOrderRef as InstanceType<typeof WorkMaintenance>)?.sendGetListRequest();
      }, 0);
    }

    if (!this.permissionsStore.getPermission('WorkOrderOperate_OrderList')) {
      this.activeName = '我的工单';
    }
  }
}
</script>

<template>
  <div class="page-corner-container">
    <bep-tabs type="card" v-model="activeName">
      <bep-tab-pane v-if="permissionsStore.getPermission('WorkOrderOperate_OrderList')" label="全部工单" name="全部工单">
        <WorkMaintenance ref="workOrderRef" :searchSimId="searchSimId" />
      </bep-tab-pane>
      <bep-tab-pane v-if="permissionsStore.getPermission('WorkOrderOperate_MyOrderList')" label="我的工单" name="我的工单">
        <WorkMaintenance :isMyWorkMaintenance="true" />
      </bep-tab-pane>
    </bep-tabs>
  </div>
</template>
