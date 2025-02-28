<script lang="ts">
import { Component, Prop } from 'vue-facing-decorator';
import { getWorkOrderOperateLogApi } from '@/apis/workOrderApi';
import BaseDialog from '@/pages/basePage/BaseDialog';
import { downloadFile } from '@/utils/commonTool';
import ViewPicDialog from '@/components/custom/ViewPicDialog.vue';
import { useWorkOrderStore } from '@/store/workOrderStore';

@Component({ components: { ViewPicDialog } })
export default class WorkMaintenanceDealRecord extends BaseDialog {
  @Prop
  workOrderId?: string;

  workOrderRecordData = null as any;

  showLoading = false;
  showPicDialog = false;
  currentPicUrl = '';
  workOrderStore = useWorkOrderStore();

  sendGetWorkOrderRecordRequest() {
    if (!this.workOrderId) {
      return;
    }
    this.showLoading = true;
    getWorkOrderOperateLogApi(this.workOrderId, (success: boolean, data) => {
      this.workOrderRecordData = data;
      this.showLoading = false;
    });
  }

  downloadOSSFile(fileLink: string, fileName: string) {
    downloadFile(fileLink, fileName);
  }

  checkoutPicModal(fileLink: string) {
    this.currentPicUrl = fileLink;
    this.showPicDialog = true;
  }
  formatterWorkOrderType(type: unknown) {
    return this.workOrderStore.workOrderTypeList.find(item => item.type == type)?.typeDesc || '/';
  }
}
</script>

<template>
  <div style="margin-top: 16px; min-height: 200px" class="horizontal-space-between" v-loading="showLoading" element-loading-text="网络加载中，请稍后~">
    <div class="vertical-start" style="width: 70%">
      <div v-for="(item, index) in workOrderRecordData" :key="`WorkStatusItem${index}`" style="padding-bottom: 16px">
        <div class="item-title-bg-class">{{ item.showName }}</div>
        <div class="item-text">
          提交时间：<span>{{ item.createTime }}</span>
        </div>
        <div class="item-text">
          提交人：<span>{{ item.createdByName }}</span>
        </div>
        <div class="item-text">
          工单状态：<span>{{ item.statusDesc }}</span>
        </div>
        <div class="item-text">
          工单类型：<span>{{ formatterWorkOrderType(item.type) }}</span>
        </div>
        <div v-if="item.remark" class="item-text">
          处理反馈：<span>{{ item.remark }}</span>
        </div>
        <div class="horizontal-start" v-if="item.attachmentLinks && item.attachmentLinks[0].fileLink">
          <div class="item-text">附件：</div>
          <div class="vertical-start">
            <div
              v-for="(mItem, index) in item.attachmentLinks"
              class="horizontal-start align-center"
              :style="{ marginTop: (index == 0 ? 2 : 8) + 'px' }"
              :key="`KWorkMainFileAttachmentList${index}`"
            >
              <img class="recharge-config-item-logo" :src="getCurrentFileLogo(mItem.fileName)" />
              <div class="upload-item-file-title">{{ mItem.fileName }}</div>
              <div class="recharge-config-item-download-button" @click="downloadOSSFile(mItem.fileLink, mItem.fileName)">下载</div>
              <div v-if="isPicFile(mItem.fileLink)" class="recharge-config-item-download-button" style="margin-top: 3px" @click="checkoutPicModal(mItem.fileLink)">查看</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <bep-timeline style="margin-right: 16px; min-width: 150px; max-width: 30%">
      <bep-timeline-item v-for="(activity, index) in workOrderRecordData" :key="index" :type="index == 0 ? 'primary' : 'info'" :timestamp="activity.createTime">
        {{ activity.showName }}
      </bep-timeline-item>
    </bep-timeline>
    <view-pic-dialog :isShowDialog="showPicDialog" :image-url="currentPicUrl" @closeDialog="showPicDialog = false"></view-pic-dialog>
  </div>
</template>

<style scoped lang="less">
@import '../../marketingActivity/rechargeSupportConfig/rechargeConfig.less';

.item-title-bg-class {
  background: rgb(245, 245, 245);
  width: 100%;
  height: 40px;
  text-align: left;
  font-size: 14px;
  line-height: 40px;
  padding-left: 16px;
}

.item-text {
  margin-top: 6px;
  margin-left: 16px;
  color: #333333;
  font-size: 14px;
  line-height: 20px;
}
</style>
