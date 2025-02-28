<!-- 工单维护 -->
<script lang="ts">
import moment from 'moment';
import AddEditWorkMaintainDialog from './AddEditWorkMaintainDialog.vue';
import BatchEditWorkMaintainDialog from './BatchEditWorkMaintainDialog.vue';
import { Search, Plus } from '@element-plus/icons-vue';
import { sendGetWorkMaintainListApi } from '@/apis/downloadCenterApi';
import ExportNotification from '@/components/custom/ExportNotification.vue';
import { Component, toNative, Prop } from 'vue-facing-decorator';
import BaseNewPage from '@/pages/basePage/BaseNewPage';
import BepAreaItemCascader from '@/components/bep/bepCascader/BepAreaItemCascader.vue';
import { usePermissionsStore } from '@/store/permissions';
import { DownloadFileType } from '@/enums/DownloadFileType';
import { IMultipleCheckedCascaderNode } from '@/components/bep/bepCascader/IMultipleCheckedCascaderNode';
import { DialogStatus } from '@/pages/basePage/DialogGlobal';
import WorkMaintenanceDetailTab from '@/pages/customerManager/workMaintenance/WorkMaintenanceDetailTab.vue';
import { sendGeAllWorkOrderListApi, sendGetMyWorkOrderListApi } from '@/apis/workOrderApi';
import { useWorkOrderStore } from '@/store/workOrderStore';
import { CascaderInstance } from 'bep-plus';
import { useUserStore } from '@/store/user';
import { ToolService } from '@/utils/toolService';
import { kSpecificTimeFormatter, kDayTimeFormatter } from '@/utils/constant';
import { UserRole } from '@/enums/UserRole';

@Component({
  components: {
    AddEditWorkMaintainDialog,
    BatchEditWorkMaintainDialog,
    WorkMaintenanceDetailTab,
    Search,
    Plus,
    ExportNotification,
    BepAreaItemCascader
  }
})
class WorkMaintenance extends BaseNewPage {
  @Prop({ type: Boolean, default: false })
  isMyWorkMaintenance?: boolean;

  @Prop({ type: String, default: '' })
  searchSimId?: string;

  tableTitleData = [
    { cellName: '工单类型', cellId: 'type', width: '120', fixed: true },
    { cellName: '小类', cellId: 'subTypeDesc', width: '120', fixed: true },
    { cellName: '所属区域', cellId: 'areaUserName', width: '140' },
    { cellName: '项目名称', cellId: 'itemUserName', width: '140' },
    { cellName: '项目编码', cellId: 'commNum', width: '140' },
    { cellName: '工单ID', cellId: 'workOrderId', width: '200' },
    { cellName: '工单来源', cellId: 'reportType', width: '140' },
    { cellName: '状态', cellId: 'status', width: '130' },
    { cellName: '优先级', cellId: 'priority', width: '100' },
    { cellName: '设备厂商', cellId: 'factoryAlias', width: '140' },
    { cellName: '设备名称', cellId: 'deviceName', width: '220' },
    { cellName: '设备编号（IMEI）', cellId: 'simId', width: '180' },
    { cellName: '插座号', cellId: 'portNum', width: '100', hover: '1-10号端口，0代表整机' },
    { cellName: '设备状态', cellId: 'deviceStatus', width: '140' },
    { cellName: '当前处理人', cellId: 'currentNodeUser', width: '160' },
    { cellName: '创建人', cellId: 'creatorUser', width: '160' },
    { cellName: '创建时间', cellId: 'createTime', width: '180' },
    { cellName: '完单人', cellId: 'completerUser', width: '180' },
    { cellName: '完单时间', cellId: 'finishTime', width: '180' },
    { cellName: '描述', cellId: 'descriptions', width: '200' },
    { cellName: '处理反馈', cellId: 'processingResult', width: '200' }
  ];

  mWorkMaintainSearchData = {
    page: 1,
    limit: 10,
    areaIdList: [] as any[],
    itemIdList: [] as any[],
    status: [] as number[],
    createDateRange: '',
    completeDateRange: '',
    creatorRole: [] as number[],
    currentRole: [] as number[],
    completerRole: [] as number[],
    subTypeList: [] as any[],
    selectUser: '',
    selectContent: '',
    deviceId: '',
    reportType: '',
    factoryAlias: ''
  };

  workStyleProps = {
    label: 'typeDesc',
    children: 'subTypeList',
    value: 'type',
    multiple: true,
    expandTrigger: 'hover'
  };

  selectBatchList = [] as any;
  selectCreateTimeList = [];
  selectFinishTimeList = [];

  isBatchDeal = false;
  showBatchDialog = false;
  showExportLoading = false;
  showExportNotification = false;

  showCheckoutDialog = false;

  permissionsStore = usePermissionsStore();
  userStore = useUserStore();
  workOrderStore = useWorkOrderStore();
  bindWorkOrderTypeList = [] as any[];
  isHandle = 2;

  sendGetListRequest() {
    if (this.showTableDataLoading) {
      return;
    }
    this.showTableDataLoading = true;
    this.mWorkMaintainSearchData.page = this.mPageInfo.pageNo;
    this.mWorkMaintainSearchData.limit = this.mPageInfo.pageSize;
    if (this.searchSimId) {
      this.mWorkMaintainSearchData.deviceId = this.searchSimId;
    }
    this.mWorkMaintainSearchData.createDateRange = '';
    this.mWorkMaintainSearchData.completeDateRange = '';
    if (this.selectCreateTimeList?.length > 0) {
      this.mWorkMaintainSearchData.createDateRange = this.selectCreateTimeList.join('~');
    }
    if (this.selectFinishTimeList?.length > 0) {
      this.mWorkMaintainSearchData.completeDateRange = this.selectFinishTimeList.join('~');
    }

    if (this.isMyWorkMaintenance) {
      // 我的工单
      sendGetMyWorkOrderListApi({ ...this.mWorkMaintainSearchData, isHandle: this.isHandle }, (success: boolean, totalCount: number, dataList: any, errMsg: string) => {
        this.showTableDataLoading = false;
        if (success) {
          this.tableData = dataList;
          this.mPageInfo.totalCount = totalCount;
          return;
        }
        this.showErrorMsg(errMsg);
      });
      return;
    }
    // 全部工单
    sendGeAllWorkOrderListApi(this.mWorkMaintainSearchData, (success: boolean, totalCount: number, dataList: any, errMsg: string) => {
      this.showTableDataLoading = false;
      if (success) {
        this.tableData = dataList;
        this.mPageInfo.totalCount = totalCount;
        return;
      }
      this.showErrorMsg(errMsg);
    });
  }

  searchMethod() {
    this.mWorkMaintainSearchData.subTypeList = [];
    const nodeInfo = (this.$refs.workOrderStyleRef as CascaderInstance).getCheckedNodes(false);
    if (nodeInfo && nodeInfo?.length > 0) {
      const twoLevelList = nodeInfo?.filter(item => item.level == 2);
      this.mWorkMaintainSearchData.subTypeList = twoLevelList?.map(item => item.value);
    }
    this.mPageInfo.pageNo = 1;
    this.sendGetListRequest();
  }

  handleReset() {
    this.mPageInfo.pageNo = 1;
    this.mPageInfo.pageSize = 10;
    this.selectCreateTimeList = [];
    this.selectFinishTimeList = [];
    this.mWorkMaintainSearchData = {
      page: 1,
      limit: 10,
      areaIdList: [],
      itemIdList: [],
      status: [],
      createDateRange: '',
      completeDateRange: '',
      creatorRole: [],
      currentRole: [],
      completerRole: [],
      subTypeList: [],
      selectUser: '',
      selectContent: '',
      deviceId: '',
      reportType: '',
      factoryAlias: ''
    };
    this.bindWorkOrderTypeList = [];
    (this.$refs.cascaderRef as InstanceType<typeof BepAreaItemCascader>).reset();
  }

  checkoutWorkmaintainMethod(row) {
    this.showCheckoutDialog = true;
    this.currentRow = row;
    this.dialogStatus = DialogStatus.DialogStatus_Checkout;
  }

  exportWorkmaintainMethod() {
    const exportParamStr = JSON.stringify(this.mWorkMaintainSearchData);
    const exportParamData = JSON.parse(exportParamStr);
    exportParamData.fileType = DownloadFileType.FILETYPE_WORK_MAINTAIN_REPORT;
    delete exportParamData.page;
    delete exportParamData.limit;

    this.showExportLoading = true;
    sendGetWorkMaintainListApi(exportParamData, (success, errMsg) => {
      this.showExportLoading = false;
      if (success) {
        this.showExportNotification = true;
        return;
      }
      this.showErrorMsg(errMsg);
    });
  }

  formatterTableRow(row, column, cellValue) {
    if (column.property == 'priority') {
      return this.workOrderStore.priorityList?.filter(item => item.value == cellValue)?.[0]?.name || '/';
    } else if (column.property == 'status') {
      return this.workOrderStore.workStatusList?.filter(item => item.value == cellValue)?.[0]?.name || '/';
    } else if (column.property == 'type') {
      return this.workOrderStore.workOrderTypeList?.filter(item => item.type == cellValue)?.[0]?.typeDesc || '/';
    } else if (column.property == 'createTime') {
      if (row.createTime) {
        return moment(new Date(row.createTime)).format(kSpecificTimeFormatter);
      }
      return ToolService.nullValueDetection(cellValue) ? '/' : cellValue;
    } else if (column.property == 'updateTime') {
      if (row.updateTime) {
        return moment(new Date(row.updateTime)).format(kSpecificTimeFormatter);
      }
      return ToolService.nullValueDetection(cellValue) ? '/' : cellValue;
    } else if (column.property == 'finishTime') {
      if (row.finishTime) {
        return moment(new Date(row.finishTime)).format(kSpecificTimeFormatter);
      }
      return ToolService.nullValueDetection(cellValue) ? '/' : cellValue;
    } else if (column.property == 'reportType') {
      return this.workOrderStore.reportTypeList?.find(item => item.value == cellValue)?.name || '/';
    } else if (column.property == 'factoryAlias') {
      return this.workOrderStore.factoryAliasList?.find(item => item.value == cellValue)?.name || '/';
    }
    return ToolService.nullValueDetection(cellValue) ? '/' : cellValue;
  }

  statusTagType(key = 0) {
    // 解析状态tag
    let str = 'primary';
    if ([3].includes(key)) {
      str = 'warning';
    } else if (key == 1) {
      str = 'danger';
    } else if (key == 2) {
      str = 'success';
    }
    return str;
  }

  priorityTagType(key = 0) {
    // 解析优先级tag
    let str = 'primary';
    if (key == 1) {
      str = 'warning';
    } else if (key == 2) {
      str = 'danger';
    } else if (key == 3) {
      str = 'success';
    }
    return str;
  }

  handleCellDidClick(row, column) {
    if (column.property == 'creator') {
      if (!row?.creator) {
        return;
      }
      const messageData = { messageName: '', userId: '' };
      messageData.messageName = 'OpenUserQueryTab';
      messageData.userId = row.creator;
      window.parent.postMessage(messageData);
    } else if (column.property == 'simId') {
      if (!row?.simId) {
        return;
      }
      const messageData: { messageName?: string; simId?: number } = {};
      messageData.messageName = 'OpenDeviceQueryTab';
      messageData.simId = row.simId;
      window.parent.postMessage(messageData);
    }
  }

  editWorkMaintenanceMethod(row) {
    this.currentRow = row;
    this.isBatchDeal = false;
    this.showBatchDialog = true;
  }

  batchEditWorkMethod() {
    if (this.selectBatchList?.length <= 0) {
      this.showErrorMsg('您还未选择工单');
      return;
    }
    this.isBatchDeal = true;
    this.showBatchDialog = true;
  }

  addWorkMethod() {
    this.currentRow = {};
    this.dialogStatus = DialogStatus.DialogStatus_Add;
    this.showDialog = true;
  }

  handleSelectionChange(val) {
    this.selectBatchList = val;
  }

  closeBatchDialog() {
    this.showBatchDialog = false;
  }

  cascaderDidChange(val: IMultipleCheckedCascaderNode) {
    this.mWorkMaintainSearchData.areaIdList = val.oneLevelKeys;
    this.mWorkMaintainSearchData.itemIdList = val.twoLevelKeys;
  }

  disabledDate(time) {
    const beginTime = moment().format(kDayTimeFormatter);
    return time.getTime() > new Date(beginTime);
  }

  isSelectedWorkOrder(row: any) {
    return this.isShowDealButton(row.currentNodeManager);
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

  selectUserPlaceHolder() {
    return this.isMyWorkMaintenance ? '发起人' : '发起人、处理人、完单人';
  }
  dealMyWorkMethod() {
    this.isHandle = this.isHandle == 1 ? 2 : 1;
    this.mPageInfo.pageNo = 1;
    this.sendGetListRequest();
  }
}

export default toNative(WorkMaintenance);
</script>

<template>
  <div style="margin-top: 16px">
    <div class="table-page-header">
      <bep-form inline>
        <div class="table-page-header-line-container">
          <bep-form-item>
            <BepAreaItemCascader customClass="table-page-header-item" ref="cascaderRef" @change="cascaderDidChange" />
          </bep-form-item>

          <bep-form-item>
            <bep-select
              class="table-page-header-item"
              v-model="mWorkMaintainSearchData.status"
              placeholder="工单状态"
              clearable
              filterable
              multiple
              collapse-tags
              :max-collapse-tag="1"
            >
              <bep-option v-for="item in workOrderStore.workStatusList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
          </bep-form-item>

          <bep-form-item label="创建时间">
            <bep-date-picker
              v-model="selectCreateTimeList"
              type="daterange"
              class="table-page-header-item"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              clearable
              placeholder="请选择"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              range-separator="至"
              :disabled-date="disabledDate"
            />
          </bep-form-item>

          <bep-form-item label="完单时间">
            <bep-date-picker
              v-model="selectFinishTimeList"
              type="daterange"
              class="table-page-header-item"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              clearable
              placeholder="请选择"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              range-separator="至"
              :disabled-date="disabledDate"
            />
          </bep-form-item>

          <bep-form-item>
            <bep-cascader
              v-model="bindWorkOrderTypeList"
              ref="workOrderStyleRef"
              class="table-page-header-item"
              filterable
              clearable
              collapse-tags
              :max-collapse-tags="1"
              collapse-tags-tooltip
              placeholder="工单类型-小类"
              :options="workOrderStore.workOrderTypeList"
              :props="workStyleProps"
            >
            </bep-cascader>
          </bep-form-item>
          <bep-form-item>
            <bep-select class="table-page-header-item" v-model="mWorkMaintainSearchData.reportType" placeholder="工单来源" clearable filterable>
              <bep-option v-for="item in workOrderStore.reportTypeList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
          </bep-form-item>
          <bep-form-item>
            <bep-select class="table-page-header-item" v-model="mWorkMaintainSearchData.factoryAlias" placeholder="设备厂商" clearable filterable>
              <bep-option v-for="item in workOrderStore.factoryAliasList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
          </bep-form-item>
          <bep-form-item>
            <bep-select
              class="table-page-header-item"
              v-model="mWorkMaintainSearchData.creatorRole"
              placeholder="发起人角色"
              clearable
              filterable
              multiple
              collapse-tags
              :max-collapse-tag="1"
            >
              <bep-option v-for="item in workOrderStore.roleList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
          </bep-form-item>

          <bep-form-item>
            <bep-select
              class="table-page-header-item"
              v-model="mWorkMaintainSearchData.currentRole"
              placeholder="当前处理人角色"
              clearable
              filterable
              multiple
              collapse-tags
              :max-collapse-tag="1"
            >
              <bep-option v-for="item in workOrderStore.roleList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
          </bep-form-item>

          <bep-form-item>
            <bep-select
              class="table-page-header-item"
              v-model="mWorkMaintainSearchData.completerRole"
              placeholder="完单人角色"
              clearable
              filterable
              multiple
              collapse-tags
              :max-collapse-tag="1"
            >
              <bep-option v-for="item in workOrderStore.roleList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
          </bep-form-item>

          <bep-form-item>
            <bep-input v-model="mWorkMaintainSearchData.selectUser" class="table-page-header-item" :placeholder="selectUserPlaceHolder()" clearable></bep-input>
          </bep-form-item>

          <bep-form-item>
            <bep-input v-model="mWorkMaintainSearchData.selectContent" class="table-page-header-item" placeholder="描述内容、处理结果内容" clearable></bep-input>
          </bep-form-item>

          <bep-form-item>
            <bep-button type="primary" @click="searchMethod">查询</bep-button>
            <bep-button type="default" @click="handleReset">重置</bep-button>
          </bep-form-item>
        </div>
        <div class="table-page-header-line-container table-operate">
          <!--          <bep-button @click="exportWorkmaintainMethod">导出</bep-button>-->

          <bep-button v-if="permissionsStore.getPermission('WorkOrderOperate_BatchProcessing')" type="primary" @click="batchEditWorkMethod">批量处理 </bep-button>
          <bep-button v-if="permissionsStore.getPermission('WorkOrderOperate_CreateWorkOrder')" type="primary" @click="addWorkMethod">
            <bep-icon>
              <Plus />
            </bep-icon>
            <span>新增</span>
          </bep-button>
          <bep-button v-if="isMyWorkMaintenance" :icon="isHandle == 1 ? 'SuccessFilled' : ''" @click="dealMyWorkMethod">
            <span v-if="isHandle != 1" style="border: 1px solid; border-radius: 50%; width: 12px; height: 12px; display: inline-block; margin-right: 6px"></span>
            待我处理</bep-button
          >
        </div>
      </bep-form>
    </div>
    <div v-loading="showExportLoading" element-loading-text="正在导出中">
      <bep-table
        v-loading="showTableDataLoading"
        element-loading-text="数据加载中，请稍后"
        :data="tableData"
        @cell-click="handleCellDidClick"
        @selection-change="handleSelectionChange"
      >
        <bep-table-column type="selection" width="60" :selectable="isSelectedWorkOrder" fixed />
        <bep-table-column type="index" label="序号" width="60" :index="indexMethod" fixed></bep-table-column>

        <template v-for="data in tableTitleData">
          <bep-table-column v-if="data.hover" :key="data.cellId" :prop="data.cellId" :show-overflow-tooltip="true" :width="data.width" scoped-slot>
            <template #header>
              <div class="horizontal-start">
                <span>{{ data.cellName }}</span>
                <bep-tooltip class="item" effect="dark" placement="right" :content="data.hover">
                  <img class="table-help-icon" src="@/assets/statistics_default_help_icon.png" />
                </bep-tooltip>
              </div>
            </template>
          </bep-table-column>
          <bep-table-column
            v-else
            :prop="data.cellId"
            :key="data.cellId + 1"
            :label="data.cellName"
            :width="data.width"
            :fixed="data.fixed ?? false"
            :show-overflow-tooltip="true"
            :formatter="formatterTableRow"
          >
            <template #default="scope">
              <bep-link v-if="scope.column.property === 'simId'" type="primary">{{ scope.row.simId }}</bep-link>
              <bep-link v-else-if="scope.column.property === 'creator'" type="primary">{{ scope.row.creator }} </bep-link>
              <span v-else-if="data.cellId == 'status'">
                <bep-tag effect="light" :type="statusTagType(scope.row[data.cellId])" disable-transitions>{{
                  formatterTableRow(scope.row, scope.column, scope.row[data.cellId])
                }}</bep-tag>
              </span>
              <span v-else-if="data.cellId == 'priority'">
                <bep-tag effect="light" :type="priorityTagType(scope.row[data.cellId])" disable-transitions>{{
                  formatterTableRow(scope.row, scope.column, scope.row[data.cellId])
                }}</bep-tag>
              </span>
              <span v-else>{{ formatterTableRow(scope.row, scope.column, scope.row[data.cellId]) }}</span>
            </template>
          </bep-table-column>
        </template>

        <bep-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <bep-button v-if="permissionsStore.getPermission('WorkOrderOperate_ViewDetails')" type="primary" link @click="checkoutWorkmaintainMethod(scope.row)">查看 </bep-button>
            <bep-button
              v-if="isShowDealButton(scope.row.currentNodeManager) && permissionsStore.getPermission('WorkOrderOperate_WorkOrderProcessing')"
              type="primary"
              link
              @click="editWorkMaintenanceMethod(scope.row)"
              >处理
            </bep-button>
          </template>
        </bep-table-column>
      </bep-table>

      <bep-pagination
        v-if="showPagation"
        style="margin-top: 16px"
        :current-page="mPageInfo.pageNo"
        :page-sizes="[10, 20, 30, 50]"
        background
        :page-size="mPageInfo.pageSize"
        :total="mPageInfo.totalCount"
        @size-change="tableSizeChange"
        @current-change="tableCurrentChange"
      />
      <AddEditWorkMaintainDialog :dialogStatus="dialogStatus" :isShowDialog="showDialog" :selectRow="currentRow" @closeDialog="closeDialog" @reloadDataList="sendGetListRequest" />

      <BatchEditWorkMaintainDialog
        :isShowDialog="showBatchDialog"
        :isBatch="isBatchDeal"
        :selectRow="currentRow"
        @closeDialog="closeBatchDialog"
        @reloadDataList="sendGetListRequest"
        :tableData="selectBatchList"
      />

      <WorkMaintenanceDetailTab
        :dialogStatus="dialogStatus"
        :isShowDialog="showCheckoutDialog"
        :select-row="currentRow"
        @dealWorkOrder="editWorkMaintenanceMethod(currentRow)"
        @closeDialog="showCheckoutDialog = false"
      />

      <ExportNotification class="notification-view-container" :show-notification="showExportNotification" @closeNotification="showExportNotification = false" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '/src/styles/business-styles.less';

.page {
  padding-left: 24px;
  padding-right: 20px;
}

.user-icon-class {
  margin-top: 16px;
  color: white;
  width: 57px;
  height: 40px;
  text-align: center;
  line-height: 40px;
  background: var(--hdui-beui-main-color);
}

.margin-left-16 {
  margin-left: 16px;
}

.edit-button-style {
  height: 26px;
  padding-top: 5px;
}
</style>
