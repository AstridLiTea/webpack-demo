<script lang="ts">
import { Prop, Component } from 'vue-facing-decorator';
import moment from 'moment';
import { useWorkOrderStore } from '@/store/workOrderStore';
import { BepButton } from 'bep-plus';
import BaseDialog from '@/pages/basePage/BaseDialog';
import { downloadFile } from '@/utils/commonTool';
import ViewPicDialog from '@/components/custom/ViewPicDialog.vue';
import { ToolService } from '@/utils/toolService';
import { kSpecificTimeFormatter } from '@/utils/constant';

@Component({
  components: { BepButton, ViewPicDialog }
})
export default class WorkMaintenanceMessage extends BaseDialog {
  @Prop
  currentRow: any;

  workOrderStore = useWorkOrderStore();

  showPicDialog = false;

  currentPicUrl = '';

  formatterTableRow(property) {
    if (property == 'priority') {
      return this.workOrderStore.priorityList?.filter(item => item.value == this.currentRow.priority)?.[0]?.name || '/';
    } else if (property == 'status') {
      return this.workOrderStore.workStatusList?.filter(item => item.value == this.currentRow.status)?.[0]?.name || '/';
    }
  }

  formatterRowCellStyle(val) {
    if (val.column.property === 'status') {
      // 优先级
      if (val?.row.priority == 1) {
        return { color: 'orange' };
      } else if (val?.row.priority == 2) {
        return { color: 'red' };
      } else if (val?.row.priority == 3) {
        return { color: '#ffb151' };
      }
    }
    if (val.column.property === 'deviceStatus') {
      return { color: '#1569C2', cursor: 'pointer', fontSize: '14px', fontWeight: '400' };
    } else if (val.column.property === 'priority') {
      if (val?.row.status == 1) {
        return { color: 'red' };
      } else if (val?.row.status == 2 || val?.row.status == 3) {
        return { color: 'orange', fontSize: '14px', fontWeight: '400' };
      } else if (val?.row.status == 4 || val?.row.status == 6) {
        return { color: '#11c770', fontSize: '14px', fontWeight: '400' };
      } else if (val?.row.status == 5) {
        return { color: '#ffb151' };
      }
    }
    return {};
  }

  statusTagType() {
    // 解析状态tag
    const key = this.currentRow.status;
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

  downloadOSSFile(fileLink: string, fileName: string) {
    downloadFile(fileLink, fileName);
  }

  formatterPriority() {
    return this.workOrderStore.priorityList?.filter(item => item.value == this.currentRow.priority)?.[0]?.name || '/';
  }

  formatterStatus() {
    return this.workOrderStore.workStatusList?.filter(item => item.value == this.currentRow.status)?.[0]?.name || '/';
  }

  formatterWorkOrderType() {
    return this.workOrderStore.workOrderTypeList.filter(item => item.type == this.currentRow.type)?.[0]?.typeDesc || '/';
  }

  formatterCreatorTime() {
    if (!this.currentRow?.createTime) {
      return '/';
    }
    return moment(this.currentRow.createTime).format(kSpecificTimeFormatter);
  }

  formatterUpdateTime() {
    if (!this.currentRow?.updateTime) {
      return '/';
    }
    return moment(this.currentRow.updateTime).format(kSpecificTimeFormatter);
  }

  formatterFinishTime() {
    if (!this.currentRow?.finishTime) {
      return '/';
    }
    return moment(this.currentRow.finishTime).format(kSpecificTimeFormatter);
  }

  formatterPortNum() {
    return ToolService.nullValueDetection(this.currentRow.portNum) ? '/' : this.currentRow.portNum;
  }

  checkoutPicModal(fileLink: string) {
    this.currentPicUrl = fileLink;
    this.showPicDialog = true;
  }
  formatterWorkReportType() {
    const label = this.workOrderStore.reportTypeList.find(item => item.value == this.currentRow.reportType)?.name;
    return label ? `${label}工单` : '/';
  }
  formatterFactoryAlias() {
    return this.workOrderStore.factoryAliasList.find(item => item.value == this.currentRow.factoryAlias)?.name ?? '/';
  }
}
</script>

<template>
  <div>
    <bep-descriptions :column="2" border style="margin-top: 16px">
      <bep-descriptions-item label="工单来源" min-width="120">{{ formatterWorkReportType() }}</bep-descriptions-item>
      <bep-descriptions-item label="工单ID" min-width="120">{{ currentRow.workOrderId }}</bep-descriptions-item>
      <bep-descriptions-item label="状态" min-width="120">
        <bep-tag effect="light" :type="statusTagType()" disable-transitions>
          {{ formatterStatus() }}
        </bep-tag>
      </bep-descriptions-item>
      <bep-descriptions-item label="所属区域" min-width="120">{{ currentRow.areaUserName }}</bep-descriptions-item>
      <bep-descriptions-item label="项目名称" min-width="120">{{ currentRow?.itemUserName || '/' }} </bep-descriptions-item>
      <bep-descriptions-item label="项目编码" min-width="120">{{ currentRow?.commNum || '/' }}</bep-descriptions-item>
      <bep-descriptions-item label="优先级" min-width="120">
        <bep-tag effect="light" :type="priorityTagType(currentRow.priority)" disable-transitions>{{ formatterPriority() }} </bep-tag>
      </bep-descriptions-item>
      <bep-descriptions-item label="工单类型" min-width="120">{{ formatterWorkOrderType() }}</bep-descriptions-item>
      <bep-descriptions-item label="小类" min-width="120">{{ currentRow?.subTypeDesc || '/' }}</bep-descriptions-item>
      <bep-descriptions-item label="设备名称" min-width="120">{{ currentRow.deviceName || '/' }}</bep-descriptions-item>
      <bep-descriptions-item label="设备编码" min-width="120">{{ currentRow?.simId || '/' }}</bep-descriptions-item>
      <bep-descriptions-item label="设备厂商" min-width="120" v-if="currentRow.deviceName || currentRow?.simId">{{ formatterFactoryAlias() }}</bep-descriptions-item>
      <bep-descriptions-item label="设备状态" min-width="120">{{ currentRow?.deviceStatus || '/' }} </bep-descriptions-item>
      <bep-descriptions-item label="插座号" min-width="120">
        <template #label>
          <div class="horizontal-start">
            <span>插座号</span>
            <bep-tooltip class="item" effect="dark" placement="right" content="1-10号端口，0代表整机">
              <img class="table-help-icon" src="@/assets/statistics_default_help_icon.png" />
            </bep-tooltip>
          </div>
        </template>
        {{ formatterPortNum() }}
      </bep-descriptions-item>
      <bep-descriptions-item :span="2" label="描述">{{ currentRow.descriptions }}</bep-descriptions-item>
      <bep-descriptions-item v-if="currentRow.attachmentLinks && currentRow.attachmentLinks[0].fileLink" :span="2" label="附件">
        <div class="horizontal-start align-center" v-for="(item, index) in currentRow.attachmentLinks" :key="`KFiledIdCheckout${index}`">
          <img class="recharge-config-item-logo" :src="getCurrentFileLogo(item.fileName)" />
          <div class="upload-item-file-title">{{ item.fileName }}</div>
          <div class="recharge-config-item-download-button" style="margin-top: 3px" @click="downloadOSSFile(item.fileLink, item.fileName)">下载</div>
          <div v-if="isPicFile(item.fileLink)" class="recharge-config-item-download-button" style="margin-top: 3px" @click="checkoutPicModal(item.fileLink)">查看</div>
        </div>
      </bep-descriptions-item>
      <bep-descriptions-item v-else :span="2" label="附件">/</bep-descriptions-item>

      <bep-descriptions-item label="创建人" min-width="120">{{ currentRow.creatorUser }}</bep-descriptions-item>
      <bep-descriptions-item label="创建时间" min-width="120">{{ formatterCreatorTime() }}</bep-descriptions-item>

      <bep-descriptions-item label="当前处理人" min-width="120">
        {{ currentRow?.currentNodeUser || '/' }}
      </bep-descriptions-item>
      <bep-descriptions-item label="更新时间" min-width="120">{{ formatterUpdateTime() }}</bep-descriptions-item>
      <bep-descriptions-item label="完单人" min-width="120">{{ currentRow?.completerUser || '/' }} </bep-descriptions-item>
      <bep-descriptions-item label="完单时间" min-width="120">{{ formatterFinishTime() }}</bep-descriptions-item>
      <bep-descriptions-item label="处理反馈" min-width="120">{{ currentRow?.processingResult || '/' }} </bep-descriptions-item>
    </bep-descriptions>

    <view-pic-dialog :isShowDialog="showPicDialog" :image-url="currentPicUrl" @closeDialog="showPicDialog = false"></view-pic-dialog>
  </div>
</template>

<style scoped lang="less">
@import '../../marketingActivity/rechargeSupportConfig/rechargeConfig.less';

.upload-item-file-title {
  height: 20px;
  width: 180px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.9);
  line-height: 20px;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
